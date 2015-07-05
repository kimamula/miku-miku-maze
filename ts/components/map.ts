'use strict';

import React = require('react');
import TypedReact = require('typed-react');
import Game = require('../actions/game');
import BabylonScene = require('../stores/babylon_scene');
import Maze = require('../stores/maze');

export interface MapProps {
    size: number;
    left: number;
    mazeData: Maze.Data;
    observables: BabylonScene.Observables;
}

interface MapState {
    position: Maze.Position;
}

class Map extends TypedReact.Component<MapProps, MapState> {
    private tdSize = this.props.size / this.props.mazeData.map.length;
    private fontSize = this.tdSize * 0.8;

    getInitialState(): MapState {
        return {'position': this.props.mazeData.start};
    }

    componentDidMount(): void {
        this.props.observables.updateMazePosition.subscribe((position: Maze.Position) => {
            this.setState({'position': position});
        });
    }

    render(): React.ReactElement<any> {
        return React.DOM.table({'style': {'marginLeft': this.props.left + 'px', 'borderSpacing': 0}},
            this.props.mazeData.map.map((row: boolean[], rowIndex: number) => {
                return React.DOM.tr({'key': rowIndex}, row.map((column: boolean, columnIndex: number) => {
                    var isCurrent = this.state.position.row === rowIndex && this.state.position.column === columnIndex,
                        isStart = this.props.mazeData.start.row === rowIndex && this.props.mazeData.start.column === columnIndex,
                        isGoal = this.props.mazeData.goal.row === rowIndex && this.props.mazeData.goal.column === columnIndex;
                    return React.DOM.td(
                        this.createTdProps(columnIndex, isCurrent, column),
                        isStart ? 'S' : isGoal ? 'G' : ''
                    );
                }));
            })
        );
    }

    private createTdProps(columnIndex: number, isCurrent: boolean, existsCube: boolean) {
        return {
            'key': columnIndex,
            'style': {
                'display': 'table-cell',
                'width': this.tdSize + 'px',
                'height': this.tdSize + 'px',
                'backgroundColor': isCurrent ? '#00ffff' : existsCube ? 'black' : 'white',
                'textAlign': 'center',
                'fontSize': this.fontSize + 'px',
                'fontWeight': 'bold',
                'padding': 0
            }
        };
    }
}

export var component = TypedReact.createClass(Map);
