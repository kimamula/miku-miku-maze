/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../node_modules/typed-react/dist/typed-react.d.ts" />
'use strict';

// for three.js server-side
if (typeof global.self === 'undefined') {
    global.self = {};
}

import React = require('react');
import TypedReact = require('typed-react');
import Game = require('../actions/game');
import UnityChan = require('../stores/unity_chan');
import Top = require('./top');
import Gl = require('./gl');

export interface AppProps {
    observers: Game.Observers;
    observables: UnityChan.Observables;
}

class App extends TypedReact.Component<AppProps, {}> {
    render(): React.ReactElement<any> {
        return React.DOM.div(null,
            React.createElement(Top, this.props),
            React.createElement(Gl, this.props)
        );
    }
}

module.exports = TypedReact.createClass(App);
