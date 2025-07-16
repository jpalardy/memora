module Scheduling exposing (..)

import DomainTypes exposing (..)
import PosixUtils exposing (..)
import Random
import Time


doubler : Int -> Random.Generator Int
doubler d =
    case d of
        1 ->
            Random.constant 2

        _ ->
            -- "doubling" d : d * 1.8..2.2
            Random.int (18 * d // 10) (22 * d // 10)


update : Time.Posix -> Random.Seed -> { a | grade : Grade, last : Maybe Time.Posix, question : b } -> ( Random.Seed, List ( b, { mark : number, next : String } ) )
update now seed card =
    case card.grade of
        Neutral ->
            ( seed, [] )

        Passed ->
            let
                daysSinceLast =
                    card.last |> Maybe.map (daysBetween now) |> Maybe.withDefault 1

                ( days, newSeed ) =
                    Random.step (doubler daysSinceLast) seed
            in
            ( newSeed, [ ( card.question, { mark = 1, next = days |> addDays now |> isoDay } ) ] )

        Failed ->
            ( seed, [ ( card.question, { mark = 0, next = isoDay now } ) ] )
