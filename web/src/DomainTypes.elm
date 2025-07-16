module DomainTypes exposing (..)

import Time


type Grade
    = Passed
    | Failed
    | Neutral


type alias Card =
    { question : String
    , answer : String
    , last : Maybe Time.Posix
    , grade : Grade

    -- `filename` not strictly necessary, but differentiates cards across decks
    , filename : String
    }


type alias Deck =
    { filename : String
    , cards : List Card
    }


type RemoteData err a
    = NotAsked
    | Loading
    | Failure err
    | Success a
