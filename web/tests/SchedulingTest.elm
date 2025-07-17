module SchedulingTest exposing (..)

import Expect
import Fuzz
import Random
import Scheduling
import Test exposing (..)


suite : Test
suite =
    describe "Scheduling module"
        [ describe "doubler"
            [ fuzz Fuzz.int "always returns 2 for 1" <|
                \n ->
                    let
                        seed =
                            Random.initialSeed n

                        ( result, _ ) =
                            Random.step (Scheduling.doubler 1) seed
                    in
                    result
                        |> Expect.equal 2
            , fuzz (Fuzz.pair Fuzz.int (Fuzz.intRange 2 1000)) "always returns roughly double the given value (>= 1.8)" <|
                \( n, days ) ->
                    let
                        seed =
                            Random.initialSeed n

                        ( result, _ ) =
                            Random.step (Scheduling.doubler days) seed
                    in
                    result
                        |> Expect.atLeast (days * 18 // 10)
            , fuzz (Fuzz.pair Fuzz.int (Fuzz.intRange 2 1000)) "always returns roughly double the given value (<= 2.2)" <|
                \( n, days ) ->
                    let
                        seed =
                            Random.initialSeed n

                        ( result, _ ) =
                            Random.step (Scheduling.doubler days) seed
                    in
                    result
                        |> Expect.atMost (days * 22 // 10)
            ]
        ]
