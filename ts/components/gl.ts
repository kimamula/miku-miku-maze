/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../node_modules/typed-react/dist/typed-react.d.ts" />
'use strict';

import React = require('react');
import TypedReact = require('typed-react');
import UnityChan = require('../stores/unity_chan');
import THREE = require('three');

declare var require:(moduleId:string) => any;
THREE.OrbitControls = require('three-orbit-controls')(THREE);
var TGALoader = require('./TGALoader')(THREE);
THREE.Loader.Handlers.add(<any>/.*\.tga$/, new TGALoader());

export interface GlProps {
    observables: UnityChan.Observables;
}

export interface GlState {
    visible: boolean;
}

class Gl extends TypedReact.Component<GlProps, GlState> {
    private scene: THREE.Scene;
    private renderer: THREE.Renderer;
    private camera: THREE.Camera;
    getInitialState(): GlState {
        return {
            'visible': false
        }
    }
    componentDidMount(): void {
        this.props.observables.loadUnityChan.subscribe((object: THREE.Object3D) => {
            this.initializeScene(<THREE.Scene>object);
            this.setState(
                {'visible': true}
            );
        });
    }
    componentWillUnmount(): void {
        this.scene = null;
    }
    render(): React.ReactElement<any> {
        return React.DOM.canvas(
            this.state.visible ?
            null :
            {'style': {'display': 'none'}}
        );
    }

    private initializeScene(scene: THREE.Scene): void {
        var target = new THREE.Vector3(0, 1, 0);

        this.scene = scene;
        this.scene.add(new THREE.GridHelper(10, 2.5));
        this.addLightsToScene(this.scene);

        this.renderer = this.createRenderer();
        this.getDOMNode().appendChild(this.renderer.domElement);

        this.camera = this.createCamera(this.renderer, this.scene, target);
        this.putOrbitControls(this.renderer, this.scene, this.camera, target);

        this.renderer.render(this.scene, this.camera);
        this.scene.children.forEach((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                console.log(child.geometry.animation);
                /*new THREE.Animation(child, child.geometry.animation).play();*/
            }
        });
    }

    private addLightsToScene(scene: THREE.Scene): void {
        return [
            {
                'color': 0xb8b8b8,
                'vector': {
                    'x': 1,
                    'y': 1,
                    'z': 1
                },
                'intensity': 1
            },
            {
                'color': 0xb8b8b8,
                'vector': {
                    'x': -1,
                    'y': 0.6,
                    'z': 0.5
                },
                'intensity': 0.5
            },
            {
                'color': 0xb8b8b8,
                'vector': {
                    'x': -0.3,
                    'y': 0.6,
                    'z': -0.8
                },
                'intensity': 0.45
            },
        ].forEach(
            (parameter: {
                color: number;
                vector: {
                    x: number;
                    y: number;
                    z: number;
                };
                intensity: number;
            }) => {
                var directionalLight = new THREE.DirectionalLight(parameter.color);
                directionalLight.position.set(
                  parameter.vector.x, parameter.vector.y, parameter.vector.z
                ).normalize();
                directionalLight.intensity = parameter.intensity;
                scene.add(directionalLight);
            }
        );
    }

    private createRenderer(): THREE.Renderer {
        var renderer = new THREE.WebGLRenderer({'alpha': true, 'antialias' : true});
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        return renderer;
    }

    private createCamera(renderer: THREE.Renderer, scene: THREE.Scene, target: THREE.Vector3): THREE.Camera {
        var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 50);
        camera.position.z = 5;
        camera.position.x = 5;
        camera.position.y = 5;
        camera.lookAt(target);
        camera.updateProjectionMatrix();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.render(scene, camera);
        });

        return camera;
    }

    private putOrbitControls(
        renderer: THREE.Renderer,
        scene: THREE.Scene,
        camera: THREE.Camera,
        target: THREE.Vector3
    ): void {
        var orbit = new THREE.OrbitControls(camera, <HTMLElement>this.getDOMNode());
        orbit.addEventListener('change', () => {
            renderer.render(scene, camera);
        });
        orbit.target = target;
    }
}

module.exports = TypedReact.createClass(Gl);
