module PosixUtils exposing (addDays, daysBetween, isoDay, msPerDay)

import Iso8601
import Time


daysBetween : Time.Posix -> Time.Posix -> Int
daysBetween p1 p2 =
    (Time.posixToMillis p1 - Time.posixToMillis p2) // msPerDay


msPerDay : Int
msPerDay =
    1000 * 60 * 60 * 24


mapPosix : (Int -> Int) -> Time.Posix -> Time.Posix
mapPosix fn date =
    date |> Time.posixToMillis |> fn |> Time.millisToPosix


addDays : Time.Posix -> Int -> Time.Posix
addDays date days =
    date |> mapPosix (\ms -> ms + days * msPerDay)



-- return: "YYYY-MM-DD"


isoDay : Time.Posix -> String
isoDay date =
    date |> Iso8601.fromTime |> String.left 10
