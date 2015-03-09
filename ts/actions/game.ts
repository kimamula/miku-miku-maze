/// <reference path="../../typings/tsd.d.ts" />
'use strict';
import Rx = require('rx');
import THREE = require('three');
import UnityChan = require('../stores/unity_chan');

export interface Observers {
    startGame: Rx.Observer<{}>;
}

export class GameAction {
    private observers: Observers = {'startGame': null};
    private startGameObservable
    = Rx.Observable.create<{}>((observer: Rx.Observer<{}>) => {
        this.observers.startGame = observer;
    });

    constructor(unityChanObserver: UnityChan.Observers) {
        this.startGameObservable.subscribe(() => {
                new THREE.JSONLoader().load(
                    '/three/unity-chan.json',
                    (geometry: THREE.Geometry, materials: THREE.Material[]) => {
                        unityChanObserver.loadUnityChan.onNext(
                            new THREE.Mesh(
                                geometry,
                                new THREE.MeshFaceMaterial(materials)
                            )
                        );
                    }
                );
        });
    }
    getObservers(): Observers {
        return this.observers;
    }
}
