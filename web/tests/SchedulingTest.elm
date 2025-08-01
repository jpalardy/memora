module SchedulingTest exposing (..)

import DomainTypes exposing (..)
import Expect
import Fuzz
import PosixUtils exposing (..)
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
            [ test "schedules a failed card for tomorrow" <|
                \_ ->
                    let
                        failedCard =
                            { question = "answer to everything"
                            , grade = Failed
                            , last = Just <| addDays testTime -10
                            }

                        update =
                            Scheduling.update testTime failedCard
                    in
                    update |> Expect.equal (Just { mark = 0, jumpRange = ( 1, 1 ) })
            , test "doesn't schedule a neutral card" <|
                \_ ->
                    let
                        failedCard =
                            { question = "answer to everything"
                            , grade = Neutral
                            , last = Just <| addDays testTime -10
                            }

                        update =
                            Scheduling.update testTime failedCard
                    in
                    update |> Expect.equal Nothing
            , test "schedules a (new) passed card for tomorrow" <|
                \_ ->
                    let
                        failedCard =
                            { question = "answer to everything"
                            , grade = Passed
                            , last = Nothing
                            }

                        update =
                            Scheduling.update testTime failedCard
                    in
                    update |> Expect.equal (Just { mark = 1, jumpRange = ( 1, 1 ) })
            , test "schedules an (old) passed card for the future" <|
                \_ ->
                    let
                        failedCard =
                            { question = "answer to everything"
                            , grade = Passed
                            , last = Just <| addDays testTime -10
                            }

                        update =
                            Scheduling.update testTime failedCard
                    in
                    update |> Expect.equal (Just { mark = 1, jumpRange = ( 18, 22 ) })
            ]
        ]
