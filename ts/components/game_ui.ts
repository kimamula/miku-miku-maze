'use strict';

import React = require('react');
import TypedReact = require('typed-react');
import BabylonScene = require('../stores/babylon_scene');
import Maze = require('../stores/maze');
import Canvas = require('./canvas');
import Overlay = require('./overlay');
import Map = require('./map');
import Game = require('../actions/game');

export interface GameUiProps {
    width: number;
    height: number;
    observers: Game.Observers;
    observables: BabylonScene.Observables;
}

interface GameUiState {
    mapElement: React.ReactElement<Map.MapProps>
}

class GameUi extends TypedReact.Component<GameUiProps, GameUiState> {
    private isPortrait = this.props.height > this.props.width;

    private canvas = React.createElement(Canvas.component, {
        'size': Math.min(this.props.width, this.props.height),
        'observers': this.props.observers
    });

    getInitialState(): GameUiState {
        return {'mapElement': null};
    }

    componentDidMount(): void {
        this.props.observables.onLoadScene.subscribe((mazeData: Maze.Data) => {
            this.setState({'mapElement': React.createElement(Map.component, {
                'size': Math.abs(this.props.width - this.props.height),
                'left': this.isPortrait ? this.props.width - this.props.height * 0.5 : 0,
                'mazeData': mazeData,
                'observables': this.props.observables
            })});
        });
    }

    render(): React.ReactElement<any> {
        return this.isPortrait ?
        React.DOM.div(null,
            React.createElement(Overlay.component, {
                'size': Math.min(this.props.width, this.props.height),
                'observables': this.props.observables
            }),
            React.createElement(Canvas.component, {
                'size': Math.min(this.props.width, this.props.height),
                'observers': this.props.observers
            }),
            this.state.mapElement
        ) :
        React.DOM.table(null,
            React.DOM.tr(null,
                React.DOM.td(null,
                    React.DOM.div(null,
                        React.createElement(Overlay.component, {
                            'size': Math.min(this.props.width, this.props.height),
                            'observables': this.props.observables
                        }),
                        React.createElement(Canvas.component, {
                            'size': Math.min(this.props.width, this.props.height),
                            'observers': this.props.observers
                        })
                    )
                ),
                React.DOM.td(null,
                    this.state.mapElement
                )
            )
        );
    }
}

export var component = TypedReact.createClass(GameUi);
