module RaggedList exposing (findElem, getAt)

import List.Extra


findElem : a -> List (List a) -> Maybe ( Int, Int )
findElem elem rows =
    let
        maybeY =
            List.Extra.findIndex (List.member elem) rows

        maybeX =
            maybeY
                |> Maybe.andThen (\y -> List.Extra.getAt y rows)
                |> Maybe.andThen (List.Extra.elemIndex elem)
    in
    Maybe.map2 Tuple.pair maybeX maybeY


getAt : ( Int, Int ) -> List (List a) -> Maybe a
getAt ( x, y ) rows =
    rows
        |> List.Extra.getAt y
        |> Maybe.andThen
            (\row ->
                let
                    minX =
                        Basics.min x (List.length row - 1)
                in
                List.Extra.getAt minX row
            )
