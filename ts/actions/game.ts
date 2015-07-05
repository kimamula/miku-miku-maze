'use strict';
import BabylonScene = require('../stores/babylon_scene');

export interface Observers {
    startGame: Rx.Observer<BABYLON.Engine>;
    accelerate: Rx.Observer<number>;
    rotate: Rx.Observer<number>;
}

export class GameAction {
    private subjects: Observers;

    constructor(babylonSceneObserver: BabylonScene.Observers) {
        var startGame = new Rx.ReplaySubject<BABYLON.Engine>(1);

        startGame.subscribe((engine: BABYLON.Engine) => {
            var canvas = engine.getRenderingCanvas(),
                webgl = canvas.getContext('experimental-webgl') || canvas.getContext('webgl'),
                animate = typeof webgl['getParameter'] === 'function' &&
                    webgl['getParameter'](WebGLRenderingContext.MAX_VERTEX_UNIFORM_VECTORS) >= 1024;
            BABYLON.SceneLoader.Load(
                'babylon/tda_miku/',
                animate ? 'tda_miku.babylon' : 'tda_miku_static.babylon',
                engine,
                (scene: BABYLON.Scene) => {
                    babylonSceneObserver.loadScene.onNext({
                        'scene': scene,
                        'animate': animate
                    });
                }
            );
        });

        this.subjects = {
            'startGame': startGame,
            'accelerate': babylonSceneObserver.accelerate,
            'rotate': babylonSceneObserver.rotate
        };
    }

    getObservers(): Observers {
        return this.subjects;
    }
}
