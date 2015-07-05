'use strict';

import BabylonScene = require('../stores/babylon_scene');
import Game = require('../actions/game');

var KEY_CODE_FORWARD = [38, 87],
    KEY_CODE_BACKWARD = [40, 83],
    KEY_CODE_LEFT = [37, 65],
    KEY_CODE_RIGHT = [39, 68],
    disableOrientationController = false;

export class KeyController {
    constructor(
        observables: BabylonScene.Observables,
        observers: Game.Observers
    ) {
        observables.onLoadScene.subscribe(() => {
            var accelerationUnit = 0.01, rotationUnit = Math.PI / 60;
            window.addEventListener('keydown', (event: KeyboardEvent) => {
                // disable orientation controller if key controller is once used
                disableOrientationController = true;
                if (event.repeat) {
                    return;
                }
                if (KEY_CODE_FORWARD.indexOf(event.keyCode) >= 0) {
                    observers.accelerate.onNext(accelerationUnit);
                } else if (KEY_CODE_BACKWARD.indexOf(event.keyCode) >= 0) {
                    observers.accelerate.onNext(-accelerationUnit);
                } else if (KEY_CODE_LEFT.indexOf(event.keyCode) >= 0) {
                    observers.rotate.onNext(-rotationUnit);
                } else if (KEY_CODE_RIGHT.indexOf(event.keyCode) >= 0) {
                    observers.rotate.onNext(rotationUnit);
                }
            });
            window.addEventListener('keyup', (event: KeyboardEvent) => {
                if (KEY_CODE_FORWARD.indexOf(event.keyCode) >= 0 ||
                KEY_CODE_BACKWARD.indexOf(event.keyCode) >= 0) {
                    observers.accelerate.onNext(0);
                } else if (KEY_CODE_LEFT.indexOf(event.keyCode) >= 0 ||
                KEY_CODE_RIGHT.indexOf(event.keyCode) >= 0) {
                    observers.rotate.onNext(0);
                }
            });
        });
    }
}

export class OrientationController {
    constructor(
        observables: BabylonScene.Observables,
        observers: Game.Observers
    ) {
        var initialBeta: number, initialGamma: number;
        observables.onLoadScene.subscribe(() => {
            window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
                if (disableOrientationController) {
                    return;
                }
                if (typeof initialBeta === 'undefined') {
                    initialBeta = event.beta;
                    initialGamma = event.gamma;
                    return;
                }
                observers.accelerate.onNext((initialBeta - event.beta) * 0.001);
                observers.rotate.onNext((initialGamma - event.gamma) * -0.001);
            });
        });
    }
}
