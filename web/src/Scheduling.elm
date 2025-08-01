module Scheduling exposing (..)

import DomainTypes exposing (Grade(..))
import PosixUtils exposing (daysBetween)
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


update : Time.Posix -> { a | grade : Grade, last : Maybe Time.Posix } -> Maybe { mark : number, jumpRange : ( Int, Int ) }
update now card =
    case card.grade of
        Neutral ->
            Nothing

        Passed ->
            let
                daysSinceLast =
                    card.last
                        |> Maybe.map (daysBetween now)
                        |> Maybe.withDefault 0
                        |> max 0
            in
            Just { mark = 1, jumpRange = doubler daysSinceLast }

        Failed ->
            Just { mark = 0, jumpRange = ( 1, 1 ) }
