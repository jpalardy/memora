module SchedulingTest exposing (..)

import DomainTypes exposing (..)
import Expect
import Fuzz
import PosixUtils exposing (..)
import Random
import Scheduling
import Test exposing (..)
import Time


testTime : Time.Posix
testTime =
    Time.millisToPosix 1754029842000


suite : Test
suite =
    describe "Scheduling module"
        [ describe "doubler on fixed values" <|
            ([ { value = 0, expected = ( 1, 1 ) }
             , { value = 1, expected = ( 2, 2 ) }
             , { value = 2, expected = ( 3, 5 ) }
             , { value = 3, expected = ( 5, 7 ) }
             , { value = 4, expected = ( 7, 9 ) }
             , { value = 5, expected = ( 9, 11 ) }
             , { value = 6, expected = ( 10, 14 ) }
             , { value = 7, expected = ( 12, 16 ) }
             , { value = 8, expected = ( 14, 18 ) }
             , { value = 9, expected = ( 16, 20 ) }
             , { value = 10, expected = ( 18, 22 ) }
             ]
                |> List.map
                    (\example ->
                        test ("returns a (rough) doubling, value = " ++ String.fromInt example.value)
                            (\_ ->
                                Scheduling.doubler example.value |> Expect.equal example.expected
                            )
                    )
            )
        , describe "doubler on all values"
            [ fuzz (Fuzz.intAtLeast 0) "always returns larger values" <|
                \n ->
                    let
                        ( low, high ) =
                            Scheduling.doubler n
                    in
                    Expect.all
                        [ Expect.lessThan low
                        , Expect.lessThan high
                        ]
                        n
            ]
        , describe "update"
            [ fuzz Fuzz.int "schedules a failed card for tomorrow" <|
                \n ->
                    let
                        seed =
                            Random.initialSeed n

                        failedCard =
                            { question = "answer to everything"
                            , grade = Failed
                            , last = Just <| addDays testTime -10
                            }

                        ( _, updatedCards ) =
                            Scheduling.update testTime seed failedCard
                    in
                    updatedCards
                        |> Expect.equal [ ( "answer to everything", { mark = 0, next = addDays testTime 1 |> isoDay } ) ]
            , fuzz Fuzz.int "doesn't schedule a neutral card" <|
                \n ->
                    let
                        seed =
                            Random.initialSeed n

                        failedCard =
                            { question = "answer to everything"
                            , grade = Neutral
                            , last = Just <| addDays testTime -10
                            }

                        ( _, updatedCards ) =
                            Scheduling.update testTime seed failedCard
                    in
                    updatedCards
                        |> Expect.equal []
            , fuzz Fuzz.int "schedules a (new) passed card for tomorrow" <|
                \n ->
                    let
                        seed =
                            Random.initialSeed n

                        failedCard =
                            { question = "answer to everything"
                            , grade = Passed
                            , last = Nothing
                            }

                        ( _, updatedCards ) =
                            Scheduling.update testTime seed failedCard
                    in
                    updatedCards
                        |> Expect.equal [ ( "answer to everything", { mark = 1, next = addDays testTime 1 |> isoDay } ) ]
            , fuzz Fuzz.int "schedules an (old) passed card for the future" <|
                \n ->
                    let
                        seed =
                            Random.initialSeed n

                        failedCard =
                            { question = "answer to everything"
                            , grade = Passed
                            , last = Just <| addDays testTime -10
                            }

                        ( _, updatedCards ) =
                            Scheduling.update testTime seed failedCard
                    in
                    updatedCards
                        |> List.map (Tuple.second >> .next)
                        |> List.all (\d -> d > isoDay testTime)
                        |> Expect.equal True
            ]
        ]
