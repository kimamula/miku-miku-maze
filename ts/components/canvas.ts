'use strict';

import React = require('react');
import TypedReact = require('typed-react');
import Rx = require('rx');
import Map = require('./map');
import Game = require('../actions/game');

export interface CanvasProps {
    size: number;
    observers: Game.Observers;
}

class Canvas extends TypedReact.Component<CanvasProps, {}> {
    private sizePx = this.props.size + 'px';

    componentDidMount(): void {
        this.props.observers.startGame.onNext(new BABYLON.Engine(
            <HTMLCanvasElement>this.getDOMNode(), true));
    }

    render(): React.ReactElement<any> {
        return React.DOM.canvas(
            {'style': {'width': this.sizePx, 'height': this.sizePx}}
        );
    }
}

export var component = TypedReact.createClass(Canvas);
