'use strict';

export interface Data {
    map: boolean[][];
    start: Position;
    goal: Position;
}

export interface Position {
    row: number;
    column: number;
}

export module MazeFactory {
    export function create(rowSize: number, columnSize: number): Data {
        var row: number,
            column: number,
            rooms: number[][] = [],
            verticalBorders: boolean[][] = [],
            horizontalBorders: boolean[][] = [],
            clusterId = 0,
            map: boolean[][] = [];

        if (rowSize * columnSize < 2) {
            throw new Error('Space not enough to create a maze!');
        }

        for (row = 0; row < rowSize; row++) {
            rooms.push([]);
            verticalBorders.push([]);
            horizontalBorders.push([]);
            for (column = 0; column < columnSize; column++, clusterId++) {
                rooms[row].push(clusterId);
                verticalBorders[row].push(true);
                horizontalBorders[row].push(true);
            }
        }

        while(!breakBorder(
            rowSize,
            columnSize,
            rooms,
            verticalBorders,
            horizontalBorders
        )) {}

        for (row = 0; row <= rowSize * 2; row++) {
            map.push([]);
            for (column = 0; column <= columnSize * 2; column++) {
                if (row === rowSize * 2) {
                    map[row].push(true);
                } else if (column === columnSize * 2) {
                    map[row].push(true);
                } else if (row % 2 === 0 && column % 2 === 0) {
                    map[row].push(true);
                } else if (row % 2 === 0) {
                    map[row].push(horizontalBorders[row / 2][(column - 1) / 2]);
                } else if (column % 2 === 0) {
                    map[row].push(verticalBorders[(row - 1) / 2][column / 2]);
                } else {
                    map[row].push(false);
                }
            }
        }

        return {
            'map': map,
            'start': {'row': rowSize * 2 - 1, 'column': 1},
            'goal': {'row': 1, 'column': columnSize * 2 - 1}
        };
    }

    function breakBorder(
        rowSize: number,
        columnSize: number,
        rooms: number[][],
        verticalBorders: boolean[][],
        horizontalBorders: boolean[][]
    ): boolean {
        var random = Math.random(), borderCount = rowSize * columnSize,
            borderAt: number, row: number, column: number,
            clusterId1: number, clusterId2: number;
        if (random < 0.5) {
            borderAt = Math.floor(random * borderCount * 2);
            column = borderAt % columnSize;
            row = (borderAt - column) / columnSize;
            if (column === 0 || !verticalBorders[row][column]) {
                return false;
            }
            clusterId1 = rooms[row][column - 1];
            clusterId2 = rooms[row][column];
            if (clusterId1 === clusterId2) {
                return false;
            }
            verticalBorders[row][column] = false;
            return replaceClusterId(rooms, clusterId1, clusterId2);
        } else {
            borderAt = Math.floor((random - 0.5) * borderCount * 2);
            column = borderAt % columnSize;
            row = (borderAt - column) / columnSize;
            if (row === 0 || !horizontalBorders[row][column]) {
                return false;
            }
            clusterId1 = rooms[row - 1][column];
            clusterId2 = rooms[row][column];
            if (clusterId1 === clusterId2) {
                return false;
            }
            horizontalBorders[row][column] = false;
            return replaceClusterId(rooms, clusterId1, clusterId2);
        }
    }

    function replaceClusterId(rooms: number[][], from: number, to: number): boolean {
        var hasSingleClusterId = true;
        rooms.forEach((row: number[]) => {
            row.forEach((room: number, column: number) => {
                if (room === from) {
                    row[column] = to;
                } else if (room !== to) {
                    hasSingleClusterId = false;
                }
            });
        });
        return hasSingleClusterId;
    }
}
