'use strict';

// for babylonjs server-side
if (typeof global['navigator'] === 'undefined') {
    global['navigator'] = {};
}

import React = require('react');
import TypedReact = require('typed-react');
import Game = require('../actions/game');
import BabylonScene = require('../stores/babylon_scene');
import GameUi = require('./game_ui');
import Map = require('./map');

export interface AppProps {
    observers: Game.Observers;
    observables: BabylonScene.Observables;
}

interface AppState {
    gameStarted: boolean;
}

class App extends TypedReact.Component<AppProps, AppState> {
    private top = React.DOM.div(null,
        React.DOM.h1(null, 'Miku Miku Maze'),
        React.DOM.button({'style': {'fontSize': '32px'}, 'onClick': () => {this.onClickGameStart()}}, 'Start game'),
        React.DOM.div({'style': {'bottom': 0, 'right': 0, 'position': 'absolute'}},
            React.DOM.h3(null, 'Materials used'),
            React.DOM.ul(null,
                React.DOM.li(null, 'Model of Hatsune Miku: ', React.DOM.a({'href': 'http://3d.nicovideo.jp/works/td1586'}, 'http://3d.nicovideo.jp/works/td1586')),
                React.DOM.li(null, 'Walking motion: ', React.DOM.a({'href': 'http://www.nicovideo.jp/watch/sm18602334'}, 'http://www.nicovideo.jp/watch/sm18602334')),
                React.DOM.li(null, 'Running motion: ', React.DOM.a({'href': 'http://www.nicovideo.jp/watch/sm18651662'}, 'http://www.nicovideo.jp/watch/sm18651662')),
                React.DOM.li(null, 'Dancing motion: ', React.DOM.a({'href': 'http://www.nicovideo.jp/watch/sm14365789'}, 'http://www.nicovideo.jp/watch/sm14365789')),
                React.DOM.li(null, 'Sky and wall materials: ', React.DOM.a({'href': 'http://blogs.msdn.com/b/davrous/archive/2014/02/19/coding4fun-tutorial-creating-a-3d-webgl-procedural-qrcode-maze-with-babylon-js.aspx'}, 'http://blogs.msdn.com/b/davrous/archive/2014/02/19/coding4fun-tutorial-creating-a-3d-webgl-procedural-qrcode-maze-with-babylon-js.aspx'))
            )
        )
    );
    private gameUi: React.ReactElement<GameUi.GameUiProps>;

    getInitialState(): AppState {
        return {'gameStarted': false};
    }
    render(): React.ReactElement<any> {
        return this.state.gameStarted ? this.gameUi : this.top;
    }

    private onClickGameStart(): void {
        this.setState({'gameStarted': true});

        this.gameUi = React.createElement(GameUi.component, {
            'width': window.innerWidth,
            'height': window.innerHeight,
            'observers': this.props.observers,
            'observables': this.props.observables
        });
    }
}

export var component = TypedReact.createClass(App);
