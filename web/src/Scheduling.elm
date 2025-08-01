module Scheduling exposing (..)

import DomainTypes exposing (..)
import PosixUtils exposing (..)
import Random
import Time


doubler : Int -> ( Int, Int )
doubler d =
    case d of
        0 ->
            ( 1, 1 )

        1 ->
            ( 2, 2 )

        _ ->
            -- "doubling" fd : fd * 1.8..2.2
            let
                fd =
                    toFloat d
            in
            ( floor <| 1.8 * fd, ceiling <| 2.2 * fd )


update : Time.Posix -> Random.Seed -> { a | grade : Grade, last : Maybe Time.Posix, question : b } -> ( Random.Seed, List ( b, { mark : number, next : String } ) )
update now seed card =
    case card.grade of
        Neutral ->
            ( seed, [] )

        Passed ->
            let
                daysSinceLast =
                    card.last |> Maybe.map (daysBetween now) |> Maybe.withDefault 0

                ( days, newSeed ) =
                    let
                        ( low, high ) =
                            doubler daysSinceLast
                    in
                    Random.step (Random.int low high) seed
            in
            ( newSeed, [ ( card.question, { mark = 1, next = days |> addDays now |> isoDay } ) ] )

        Failed ->
            ( seed, [ ( card.question, { mark = 0, next = addDays now 1 |> isoDay } ) ] )
