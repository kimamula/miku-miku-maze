/// <reference path="../../typings/tsd.d.ts" />
'use strict';
import Rx = require('rx');
import THREE = require('three');

export interface Observers {
    loadUnityChan: Rx.Observer<THREE.Object3D>;
}

export interface Observables {
    loadUnityChan: Rx.Observable<THREE.Object3D>;
}

export class UnityChanStore {
    private observers: Observers = {'loadUnityChan': null};
    private linkingObservable = Rx.Observable.create<THREE.Object3D>((observer: Rx.Observer<THREE.Object3D>) => {
        this.observers.loadUnityChan = observer;
    });

    private componentObservers: Rx.Observer<THREE.Object3D>[] = [];
    private observables: Observables = {
        'loadUnityChan': Rx.Observable.create<THREE.Object3D>((observer: Rx.Observer<THREE.Object3D>) => {
            this.componentObservers.push(observer);
        })
    };

    constructor() {
        this.linkingObservable.subscribe((object: THREE.Object3D) => {
            this.componentObservers.forEach((componentObserver: Rx.Observer<THREE.Object3D>) => {
                componentObserver.onNext(object);
            });
        });
    }


    getObservers(): Observers {
        return this.observers;
    }

    getObservables(): Observables {
        return this.observables;
    }
}
