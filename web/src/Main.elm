port module Main exposing (main)

import Browser
import Browser.Events
import DomainTypes exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Html.Keyed
import Http
import Json.Decode as Decode
import List.Extra
import Markdown
import PosixUtils exposing (..)
import RaggedList
import Random
import Random.Extra
import Random.List
import Server
import Time


cardsPercolumn : Int
cardsPercolumn =
    4


type Msg
    = GotDecks (Result Http.Error (List Deck))
    | GotShuffledDecks (List Deck) (List (List Card))
    | Select Card
    | Flip Card
    | Unflip
    | KeyDown String
    | PreventedKeyDown String
    | PreventedKeyUp String
    | MouseMoved


type Focus
    = None
    | Selected Card
    | Flipped Card


type alias Model =
    { now : Time.Posix
    , decks : RemoteData Http.Error (List Deck)
    , focus : Focus
    , mouseDisabled : Bool
    }



-------------------------------------------------


targetCard : Focus -> Maybe Card
targetCard focus =
    case focus of
        None ->
            Nothing

        Selected card ->
            Just card

        Flipped card ->
            Just card


mapFocus : (Card -> Card) -> Focus -> Focus
mapFocus mapper focus =
    case focus of
        None ->
            focus

        Selected card_ ->
            Selected (mapper card_)

        Flipped card_ ->
            Flipped (mapper card_)


type Direction
    = Up
    | Right
    | Down
    | Left
    | Top
    | Bottom


findNewFocus : List Deck -> Focus -> Direction -> Focus
findNewFocus decks focus direction =
    let
        cards =
            List.concatMap .cards decks

        raggedCards =
            List.concatMap (.cards >> List.Extra.greedyGroupsOf cardsPercolumn) decks

        newFocus =
            Maybe.withDefault None << Maybe.map Selected

        findRelativeLR card dx =
            cards
                |> List.Extra.elemIndex card
                |> Maybe.andThen (\x -> List.Extra.getAt (x + dx) cards)
                |> Maybe.withDefault card

        findRelativeUD card dy =
            raggedCards
                |> RaggedList.findElem card
                |> Maybe.andThen (\( x, y ) -> RaggedList.getAt ( x, y + dy ) raggedCards)
                |> Maybe.withDefault card
    in
    case ( cards, targetCard focus, direction ) of
        ( [], _, _ ) ->
            None

        ( _, _, Top ) ->
            newFocus <| List.head cards

        ( _, _, Bottom ) ->
            newFocus <| List.Extra.last cards

        ( _, Nothing, Right ) ->
            newFocus <| List.head cards

        ( _, Nothing, Down ) ->
            newFocus <| List.head cards

        ( _, Nothing, Up ) ->
            newFocus <| List.Extra.last cards

        ( _, Nothing, Left ) ->
            newFocus <| List.Extra.last cards

        ( _, Just card_, Right ) ->
            newFocus <| Just <| findRelativeLR card_ 1

        ( _, Just card_, Down ) ->
            newFocus <| Just <| findRelativeUD card_ 1

        ( _, Just card_, Up ) ->
            newFocus <| Just <| findRelativeUD card_ -1

        ( _, Just card_, Left ) ->
            newFocus <| Just <| findRelativeLR card_ -1



-------------------------------------------------


port preventedKeydown : (String -> msg) -> Sub msg


port preventedKeyup : (String -> msg) -> Sub msg


port mouseMoved : (() -> msg) -> Sub msg


port scrollToSelected : () -> Cmd msg



-------------------------------------------------


init : Int -> ( Model, Cmd Msg )
init now =
    ( { now = Time.millisToPosix now
      , decks = Loading
      , focus = None
      , mouseDisabled = False
      }
    , Server.getDecks GotDecks
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    let
        keyboardFocus direction =
            let
                newFocus =
                    case model.decks of
                        Success decks ->
                            findNewFocus decks model.focus direction

                        _ ->
                            model.focus
            in
            ( { model | focus = newFocus, mouseDisabled = True }, scrollToSelected () )
    in
    case msg of
        GotDecks (Ok decks) ->
            let
                cmd =
                    decks
                        |> List.map
                            (\deck ->
                                deck.cards
                                    |> List.filter
                                        (.last
                                            >> Maybe.map (\last -> daysBetween model.now last > 0)
                                            >> Maybe.withDefault True
                                        )
                                    |> Random.List.shuffle
                            )
                        |> Random.Extra.sequence
                        |> Random.generate (GotShuffledDecks decks)
            in
            ( model, cmd )

        GotDecks (Err err) ->
            ( { model | decks = Failure err }, Cmd.none )

        GotShuffledDecks decks deckCards ->
            let
                newDecks =
                    List.map2 (\deck cards -> { deck | cards = cards }) decks deckCards
            in
            ( { model | decks = Success newDecks, focus = None }, Cmd.none )

        Select card ->
            ( { model | focus = Selected card }, Cmd.none )

        Flip card ->
            ( { model | focus = Flipped card }, Cmd.none )

        Unflip ->
            let
                newFocus =
                    case model.focus of
                        Flipped card ->
                            Selected card

                        focus ->
                            focus
            in
            ( { model | focus = newFocus }, Cmd.none )

        KeyDown "y" ->
            ( gradeSelectedCard Passed model, Cmd.none )

        KeyDown "n" ->
            ( gradeSelectedCard Failed model, Cmd.none )

        KeyDown "Backspace" ->
            ( gradeSelectedCard Neutral model, Cmd.none )

        KeyDown "Delete" ->
            ( gradeSelectedCard Neutral model, Cmd.none )

        KeyDown " " ->
            case targetCard model.focus of
                Nothing ->
                    ( model, Cmd.none )

                Just card_ ->
                    ( { model | focus = Flipped card_ }, Cmd.none )

        KeyDown _ ->
            ( model, Cmd.none )

        PreventedKeyDown "Save" ->
            case model.decks of
                Success decks ->
                    ( model, Server.postDecks decks model.now GotDecks )

                _ ->
                    ( model, Cmd.none )

        PreventedKeyDown "ArrowUp" ->
            keyboardFocus Up

        PreventedKeyDown "ArrowRight" ->
            keyboardFocus Right

        PreventedKeyDown "ArrowDown" ->
            keyboardFocus Down

        PreventedKeyDown "ArrowLeft" ->
            keyboardFocus Left

        PreventedKeyDown "Home" ->
            keyboardFocus Top

        PreventedKeyDown "End" ->
            keyboardFocus Bottom

        PreventedKeyDown _ ->
            ( model, Cmd.none )

        PreventedKeyUp " " ->
            case targetCard model.focus of
                Nothing ->
                    ( model, Cmd.none )

                Just card_ ->
                    ( { model | focus = Selected card_ }, Cmd.none )

        PreventedKeyUp _ ->
            ( model, Cmd.none )

        MouseMoved ->
            ( { model | mouseDisabled = False }, Cmd.none )


gradeSelectedCard : Grade -> Model -> Model
gradeSelectedCard newGrade model =
    case targetCard model.focus of
        Nothing ->
            model

        Just card_ ->
            let
                mapper card =
                    if card == card_ then
                        { card | grade = newGrade }

                    else
                        card

                updateDecks decks =
                    List.map (\deck -> { deck | cards = List.map mapper deck.cards }) decks
            in
            case model.decks of
                Success decks ->
                    { model
                        | decks = Success <| updateDecks decks
                        , focus = mapFocus mapper model.focus
                    }

                _ ->
                    model



-------------------------------------------------


pluralize : Int -> String -> String -> String
pluralize count singular plural =
    case count of
        0 ->
            "no " ++ plural

        1 ->
            "1 " ++ singular

        _ ->
            String.fromInt count ++ " " ++ plural


relativeTime : Time.Posix -> Time.Posix -> String
relativeTime now last =
    case daysBetween now last of
        0 ->
            "today"

        1 ->
            "yesterday"

        days ->
            String.fromInt days ++ " days ago"


view : Model -> Html Msg
view model =
    case model.decks of
        Success decks ->
            viewDecks model.now model.focus model.mouseDisabled decks

        Failure err ->
            let
                errorMsg =
                    case err of
                        Http.BadBody body ->
                            body

                        _ ->
                            "Cannot fetch decks"
            in
            div [ class "error-banner" ] [ text errorMsg ]

        _ ->
            div [] []


viewDecks : Time.Posix -> Focus -> Bool -> List Deck -> Html Msg
viewDecks now focus mouseDisabled decks =
    div [ class "container", classList [ ( "mouse-off", mouseDisabled ) ], onMouseUp Unflip ] <|
        List.map (viewDeck now focus) decks


viewDeck : Time.Posix -> Focus -> Deck -> Html Msg
viewDeck now focus deck =
    div [ class "deck" ]
        [ h2 [] [ text deck.filename ]
        , h3 [ class "subtext" ] [ text <| pluralize (List.length deck.cards) "card" "cards" ]
        , Html.Keyed.node "div" [ class "cards" ] <| List.map (viewCard now focus) deck.cards
        ]


viewCard : Time.Posix -> Focus -> Card -> ( String, Html Msg )
viewCard now focus card =
    let
        defaults =
            Markdown.defaultOptions

        unsanitized =
            { defaults | sanitize = False }

        visibleText =
            if focus == Flipped card then
                card.answer

            else
                card.question

        selected =
            (focus == Selected card) || (focus == Flipped card)
    in
    ( card.question
    , div
        [ class "card"
        , classList
            [ ( "selected", selected )
            , ( "passed", card.grade == Passed )
            , ( "failed", card.grade == Failed )
            ]
        , onMouseEnter <| Select card
        , onMouseDown <| Flip card
        ]
        [ span [ class "text" ] [ Markdown.toHtmlWith unsanitized [] visibleText ]
        , span [ class "preview" ] [ card.last |> Maybe.map (relativeTime now) |> Maybe.withDefault "(new card)" |> text ]
        ]
    )



-------------------------------------------------


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Browser.Events.onKeyDown (Decode.map KeyDown (Decode.field "key" Decode.string))
        , preventedKeydown PreventedKeyDown
        , preventedKeyup PreventedKeyUp
        , mouseMoved (always MouseMoved)
        ]



-------------------------------------------------


main : Program Int Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }
