'use strict';

import App = require('./components/app');
import Controller = require('./components/controller');
import Game = require('./actions/game');
import BabylonScene = require('./stores/babylon_scene');
import React = require('react');

var babylonSceneStore = new BabylonScene.BabylonSceneStore(60, 10),
    gameAction = new Game.GameAction(babylonSceneStore.getObservers()),
    keyController = new Controller.KeyController(
        babylonSceneStore.getObservables(), gameAction.getObservers()),
    orientationController = new Controller.OrientationController(
        babylonSceneStore.getObservables(), gameAction.getObservers());



React.render(React.createElement(App.component, {
    'observers': gameAction.getObservers(),
    'observables': babylonSceneStore.getObservables()
}), document.body);
