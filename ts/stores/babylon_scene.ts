'use strict';

import Maze = require('./maze');

export interface Observers {
    loadScene: Rx.Observer<{
        'scene': BABYLON.Scene,
        'animate': boolean
    }>;
    accelerate: Rx.Observer<number>;
    rotate: Rx.Observer<number>;
}

export interface Observables {
    onLoadScene: Rx.Observable<Maze.Data>;
    onTimeUpdate: Rx.Observable<number>;
    onGoal: Rx.Observable<{}>;
    onStartDance: Rx.Observable<{}>;
    updateMazePosition: Rx.Observable<Maze.Position>;
}

export class BabylonSceneStore {
    private static MAXIMUM_VELOCITY = 0.5;
    private observers = {
        'loadScene': new Rx.ReplaySubject<{
            'scene': BABYLON.Scene,
            'animate': boolean
        }>(1),
        'accelerate': new Rx.ReplaySubject<number>(1),
        'rotate': new Rx.ReplaySubject<number>(1)
    };

    private observables = {
        'onLoadScene': new Rx.ReplaySubject<Maze.Data>(1),
        'onTimeUpdate': new Rx.ReplaySubject<number>(1),
        'onGoal': new Rx.ReplaySubject<{}>(1),
        'onStartDance': new Rx.ReplaySubject<{}>(1),
        'updateMazePosition': new Rx.ReplaySubject<Maze.Position>(1)
    };

    private velocity = 0;
    private acceleration = 0;
    private absoluteRotation = 0.5 * Math.PI;
    private relativeRotation = 0;

    constructor(timeLimitSec: number, mazeSize: number) {
        this.observers.loadScene.subscribe((loadScene: {
            'scene': BABYLON.Scene,
            'animate': boolean
        }) => {
            var scene = loadScene.scene, engine = scene.getEngine();
            scene.executeWhenReady(() => {
                var skeleton = scene.getSkeletonById(<any>0),
                    halfPi = Math.PI / 2,
                    characterMesh = scene.meshes[0],
                    mazeData = Maze.MazeFactory.create(mazeSize, mazeSize),
                    mazeVerticalSize = mazeData.map[0].length,
                    mazeHorizontalSize = mazeData.map.length,
                    mazeMesh: BABYLON.Mesh,
                    mazeCubeSize = 6,
                    initialPositionX: number,
                    initialPositionZ: number,
                    previousMazePosition = mazeData.start,
                    walkRunBoundary = 0.2,
                    ground: BABYLON.Mesh,
                    followCamera = new BABYLON.FollowCamera('FollowCamera', new BABYLON.Vector3(0, 0, 0), scene),
                    timerDisposable = Rx.Observable.timer(0, 1000)
                        .take(timeLimitSec + 1)
                        .subscribe((elapsedTimeSec: number) => {
                            var remainingTimeSec = timeLimitSec - elapsedTimeSec;
                            if (remainingTimeSec === 0) {
                                engine.stopRenderLoop();
                            }
                            this.observables.onTimeUpdate.onNext(remainingTimeSec);
                        }),
                    postGoalFrames = 180;

                scene.collisionsEnabled = true;
                scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
                loadScene.animate && scene.beginAnimation(skeleton, 46, 125, true, 1);

                characterMesh = scene.meshes[0];
                characterMesh.rotate(BABYLON.Axis.Y, this.absoluteRotation, BABYLON.Space.LOCAL);
                characterMesh.checkCollisions = true;
                characterMesh.ellipsoid = new BABYLON.Vector3(1, 1, 1);
                characterMesh.position.addInPlace(
                    this.convertToVector3(mazeData.map, mazeCubeSize, mazeData.start)
                );

                scene.activeCamera = followCamera;
                scene.activeCamera.attachControl(engine.getRenderingCanvas());
                followCamera.target = characterMesh;
                followCamera.radius = 4;
                followCamera.heightOffset = 7.5;

                mazeMesh = this.renderMaze(mazeData, mazeCubeSize, scene);
                mazeMesh.checkCollisions = true;

                ground = this.createGround(
                    2 * mazeHorizontalSize * mazeCubeSize,
                    2 * mazeVerticalSize * mazeCubeSize,
                    scene
                );
                this.createSky(scene);

                scene.render();
                initialPositionX = characterMesh.absolutePosition.x;
                initialPositionZ = characterMesh.absolutePosition.z;

                engine.runRenderLoop(() => {
                    var newVelocity = this.velocity + this.acceleration,
                        previousVelocity = this.velocity,
                        currentMazePosition: Maze.Position;
                    if (newVelocity > BabylonSceneStore.MAXIMUM_VELOCITY) {
                        this.velocity = BabylonSceneStore.MAXIMUM_VELOCITY;
                    } else if (newVelocity < 0) {
                        this.velocity = 0;
                    } else {
                        this.velocity = newVelocity;
                    }
                    this.absoluteRotation += this.relativeRotation;

                    if (this.relativeRotation) {
                        characterMesh.rotate(BABYLON.Axis.Y, this.relativeRotation, BABYLON.Space.LOCAL);
                    }
                    if (this.velocity) {
                        characterMesh.moveWithCollisions(new BABYLON.Vector3(
                            -Math.sin(this.absoluteRotation) * this.velocity,
                            0,
                            -Math.cos(this.absoluteRotation) * this.velocity
                        ));
                    }

                    if (loadScene.animate) {
                        if (this.velocity > walkRunBoundary) {
                            if (previousVelocity <= walkRunBoundary) {
                                scene.beginAnimation(skeleton, 6, 45, true, 1);
                            }
                        } else {
                            if (previousVelocity > walkRunBoundary) {
                                scene.beginAnimation(skeleton, 46, 125, true, 1);
                            }
                        }
                    }
                    followCamera.rotation.x -= 0.3;

                    currentMazePosition = this.getCurrentMazePosition(
                        initialPositionX,
                        initialPositionZ,
                        characterMesh.absolutePosition,
                        mazeData,
                        mazeCubeSize
                    );
                    if (currentMazePosition.row !== previousMazePosition.row ||
                        currentMazePosition.column !== previousMazePosition.column) {
                        previousMazePosition = currentMazePosition;
                        this.observables.updateMazePosition.onNext(currentMazePosition);
                        if (currentMazePosition.row === mazeData.goal.row &&
                            currentMazePosition.column === mazeData.goal.column) {
                            this.observables.onGoal.onNext(null);
                            timerDisposable.dispose();
                            engine.stopRenderLoop();
                            var diffY = - (mazeCubeSize / postGoalFrames) * 1.2;
                            engine.runRenderLoop(() => {
                                var arcRotateCamera: BABYLON.ArcRotateCamera;
                                if (postGoalFrames > 0) {
                                    postGoalFrames -= 1;
                                    mazeMesh.position.addInPlace(new BABYLON.Vector3(0, diffY, 0));
                                    characterMesh.moveWithCollisions(new BABYLON.Vector3(
                                        -Math.sin(this.absoluteRotation) * this.velocity,
                                        0,
                                        -Math.cos(this.absoluteRotation) * this.velocity
                                    ));
                                    followCamera.rotation.x -= 0.3;
                                } else if (postGoalFrames === 0) {
                                    postGoalFrames -= 1;
                                    this.observables.onStartDance.onNext(null);
                                    arcRotateCamera = new BABYLON.ArcRotateCamera('ArcRotateCamera', halfPi, halfPi, 8, characterMesh.position.add(new BABYLON.Vector3(0, 2, 0)), scene);
                                    arcRotateCamera.pinchPrecision = 10;
                                    arcRotateCamera.wheelPrecision = 10;
                                    scene.activeCamera = arcRotateCamera;
                                    scene.activeCamera.attachControl(engine.getRenderingCanvas());
                                    /*scene.lights[0].intensity = 2;*/
                                    loadScene.animate && scene.beginAnimation(skeleton, 1203, 3003, true, 1);
                                }
                                scene.render();
                            });
                        }
                    }

                    scene.render();
                });
                this.observables.onLoadScene.onNext(mazeData);
            });
        });
        this.observers.accelerate.subscribe((acceleration: number) => {
            this.acceleration = acceleration;
        });
        this.observers.rotate.subscribe((rotation: number) => {
            this.relativeRotation = rotation;
        });
    }

    getObservers(): Observers {
        return this.observers;
    }

    getObservables(): Observables {
        return this.observables;
    }

    private renderMaze(mazeData: Maze.Data, mazeCubeSize: number, scene: BABYLON.Scene): BABYLON.Mesh {
        var mazeMesh: BABYLON.Mesh,
            meshes: BABYLON.Mesh[] = [],
            template = BABYLON.Mesh.CreateBox('templateCube', mazeCubeSize, scene),
            cubeMaterial = new BABYLON.StandardMaterial('cubeMaterial', scene),
            maze = mazeData.map;

        cubeMaterial.emissiveTexture = new BABYLON.Texture('babylon/environment/masonry-wall-texture.jpg', scene);
        cubeMaterial.bumpTexture = new BABYLON.Texture('babylon/environment/masonry-wall-bump-map.jpg', scene);
        cubeMaterial.specularTexture = new BABYLON.Texture('babylon/environment/masonry-wall-normal-map.jpg', scene);
        cubeMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        maze.forEach((row: boolean[], rowIndex: number) => {
            row.forEach((existsCube: boolean, columnIndex: number) => {
                if (existsCube) {
                    var cube = template.clone('cloneCube' + rowIndex + columnIndex);
                    cube.position.addInPlace(this.convertToVector3(
                        mazeData.map,
                        mazeCubeSize,
                        {'row': rowIndex, 'column': columnIndex},
                        0.5 * mazeCubeSize - 1
                    ));
                    meshes.push(cube);
                }
            });
        });

        template.dispose(false);

        mazeMesh = this.mergeMeshes('maze', meshes, scene);
        mazeMesh.material = cubeMaterial;
        return mazeMesh;
    }

    private createGround(width: number, height: number, scene: BABYLON.Scene): BABYLON.Mesh {
        var groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene),
            ground = BABYLON.Mesh.CreateGround('ground', width, height, 1, scene, false);

        groundMaterial.emissiveTexture = new BABYLON.Texture('babylon/environment/arroway.de_tiles-35_d100.jpg', scene);
        groundMaterial.bumpTexture = new BABYLON.Texture('babylon/environment/arroway.de_tiles-35_b010.jpg', scene);
        groundMaterial.specularTexture = new BABYLON.Texture('babylon/environment/arroway.de_tiles-35_s100-g100-r100.jpg', scene);

        ground.material = groundMaterial;

        return ground;
    }

    private createSky(scene: BABYLON.Scene): BABYLON.Mesh {
        var skybox = BABYLON.Mesh.CreateBox('skybox', 300.0, scene),
            skyboxMaterial = new BABYLON.StandardMaterial('skyboxMaterial', scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('babylon/environment/skybox', scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
        skybox.infiniteDistance = true;
        return skybox;
    }

    private mergeMeshes (name: string, meshes: BABYLON.Mesh[], scene: BABYLON.Scene): BABYLON.Mesh {
        var arrayPos: number[][] = [],
        	arrayNormal: number[][] = [],
        	arrayUv: number[] = [],
        	arrayUv2: number[] = [],
        	arrayColor: number[] = [],
        	arrayMatricesIndices: number[] = [],
        	arrayMatricesWeights: number[] = [],
        	arrayIndices: number[] = [],
        	savedPosition: BABYLON.Vector3[] = [],
        	savedNormal: BABYLON.Vector3[] = [],
        	newMesh = new BABYLON.Mesh(name, scene),
        	uvKind = true,
        	uv2Kind = true,
        	colorKind = true,
        	matricesIndicesKind = true,
        	matricesWeightsKind = true;

        meshes.forEach((mesh: BABYLON.Mesh) => {
            mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind) || (uvKind = false);
            mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind) || (uv2Kind = false);
            mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind) || (colorKind = false);
            mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) || (matricesIndicesKind = false);
            mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind) || (matricesWeightsKind = false);
        });

        meshes.forEach((mesh: BABYLON.Mesh) => {
            var index: number,
                maxValue = savedPosition.length,
                worldMatrix: BABYLON.Matrix,
                pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),
                normal = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);

            mesh.computeWorldMatrix(true);
            worldMatrix = mesh.getWorldMatrix();

            arrayPos.push(pos);
            arrayNormal.push(normal);
            uvKind && (arrayUv = arrayUv.concat(mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)));
            uv2Kind && (arrayUv2 = arrayUv2.concat(mesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind)));
            colorKind && (arrayColor = arrayColor.concat(mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind)));
            matricesIndicesKind && (arrayMatricesIndices = arrayMatricesIndices.concat(mesh.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind)));
            matricesWeightsKind && (arrayMatricesWeights = arrayMatricesWeights.concat(mesh.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind)));

            for (index = 0; index < pos.length;) {
                savedPosition.push(BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(pos[index++], pos[index++], pos[index++]), worldMatrix));
            }

            for (index = 0; index < normal.length;) {
                savedNormal.push(BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(normal[index++], normal[index++], normal[index++]), worldMatrix));
            }

            mesh.getIndices().forEach((index: number) => {
                arrayIndices.push(index + maxValue);
            });

            mesh.dispose(false);
        });

        newMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, this.toNumberArray(savedPosition), false);
        newMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, this.toNumberArray(savedNormal), false);
        arrayUv.length && newMesh.setVerticesData(BABYLON.VertexBuffer.UVKind, arrayUv, false);
        arrayUv2.length && newMesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, arrayUv, false);
        arrayColor.length && newMesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, arrayUv, false);
        arrayMatricesIndices.length && newMesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, arrayUv, false);
        arrayMatricesWeights.length && newMesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, arrayUv, false);

        newMesh.setIndices(arrayIndices);
        return newMesh;
    }

    private toNumberArray(vectorArray: BABYLON.Vector3[]): number[] {
        return vectorArray.reduce((numberArray: number[], vector: BABYLON.Vector3) => {
            numberArray.push(vector.x);
            numberArray.push(vector.y);
            numberArray.push(vector.z);
            return numberArray;
        }, []);
    }

    private getCurrentMazePosition(
        initialPositionX: number,
        initialPositionZ: number,
        currentPosition: BABYLON.Vector3,
        mazeData: Maze.Data,
        mazeCubeSize: number
    ): Maze.Position {
        return {
            'row': Math.round((currentPosition.x - initialPositionX) / mazeCubeSize) + mazeData.start.row,
            'column': Math.round((currentPosition.z - initialPositionZ) / mazeCubeSize) + mazeData.start.column
        };
    }

    private convertToVector3(mazeMap: boolean[][], mazeCubeSize: number, position: Maze.Position, y = 0): BABYLON.Vector3 {
        return new BABYLON.Vector3(
            (position.row - 1 - (mazeMap.length / 2)) * mazeCubeSize,
            y,
            (position.column - 1 - (mazeMap[0].length / 2)) * mazeCubeSize
        );
    }
}
