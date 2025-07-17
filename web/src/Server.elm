module Server exposing (..)

import Dict
import DomainTypes exposing (..)
import Http
import Iso8601
import Json.Decode as Decode
import Json.Decode.Pipeline as Pipeline
import Json.Encode
import PosixUtils exposing (..)
import Random
import Scheduling
import Time



-------------------------------------------------
-- HTTP
-------------------------------------------------


getDecks : (Result Http.Error (List Deck) -> msg) -> Cmd msg
getDecks msg =
    Http.get
        { url = "decks.json"
        , expect = Http.expectJson msg (Decode.list deckDecoder)
        }


postDecks : List Deck -> Time.Posix -> (Result Http.Error (List Deck) -> msg) -> Cmd msg
postDecks decks now msg =
    case generateDeckUpdates decks now of
        [] ->
            Cmd.none

        updates ->
            Http.post
                { url = "decks"
                , body = updates |> Json.Encode.list encodeDeckUpdate |> Http.jsonBody
                , expect = Http.expectJson msg (Decode.list deckDecoder)
                }



-------------------------------------------------
-- decoders
-------------------------------------------------


deckDecoder : Decode.Decoder Deck
deckDecoder =
    Decode.field "filename" Decode.string
        |> Decode.andThen
            (\filename ->
                Decode.succeed Deck
                    |> Pipeline.required "filename" (Decode.succeed filename)
                    |> Pipeline.required "cards" (Decode.list (cardDecoder filename))
            )


cardDecoder : String -> Decode.Decoder Card
cardDecoder filename =
    Decode.succeed Card
        |> Pipeline.required "question" Decode.string
        |> Pipeline.required "answer" Decode.string
        |> Pipeline.optional "last" (Decode.maybe Iso8601.decoder) Nothing
        |> Pipeline.hardcoded Neutral
        |> Pipeline.hardcoded filename



-------------------------------------------------
-- encoders
-------------------------------------------------


type alias CardUpdate =
    { mark : Int
    , next : String
    }


type alias DeckUpdate =
    { filename : String
    , updates : Dict.Dict String CardUpdate
    }


encodeCardUpdate : CardUpdate -> Json.Encode.Value
encodeCardUpdate cardUpdate =
    Json.Encode.object
        [ ( "mark", Json.Encode.int cardUpdate.mark )
        , ( "next", Json.Encode.string cardUpdate.next )
        ]


encodeDeckUpdate : DeckUpdate -> Json.Encode.Value
encodeDeckUpdate deckUpdate =
    Json.Encode.object
        [ ( "filename", Json.Encode.string deckUpdate.filename )
        , ( "updates", Json.Encode.dict identity encodeCardUpdate deckUpdate.updates )
        ]


generateDeckUpdates : List Deck -> Time.Posix -> List DeckUpdate
generateDeckUpdates decks now =
    let
        seed =
            now |> Time.posixToMillis |> Random.initialSeed

        updatesForDeck currentSeed deck =
            let
                ( nextSeed, deckUpdates ) =
                    mapWithSeed currentSeed (Scheduling.update now) deck.cards
            in
            ( nextSeed
            , { filename = deck.filename, updates = deckUpdates |> List.concat |> Dict.fromList }
            )
    in
    decks
        |> mapWithSeed seed updatesForDeck
        |> Tuple.second
        |> List.filter (not << Dict.isEmpty << .updates)


mapWithSeed : Random.Seed -> (Random.Seed -> a -> ( Random.Seed, b )) -> List a -> ( Random.Seed, List b )
mapWithSeed seed fn list =
    List.foldr
        (\item ( currentSeed, acc ) ->
            let
                ( nextSeed, mappedItem ) =
                    fn currentSeed item
            in
            ( nextSeed, mappedItem :: acc )
        )
        ( seed, [] )
        list
