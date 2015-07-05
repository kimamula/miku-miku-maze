'use strict';

import React = require('react');
import TypedReact = require('typed-react');
import BabylonScene = require('../stores/babylon_scene');

export interface OverlayProps {
    size: number;
    observables: BabylonScene.Observables;
}

interface OverlayState {
    remainingTimeSec: number;
    gameState: GameState;
}

const enum GameState {
    PRE_PLAY, PLAYING, GOAL, DANCING, GAME_OVER
}

export class Overlay extends TypedReact.Component<OverlayProps, OverlayState> {
    private static TIMER_FONT_SIZE = 40;
    private static GAME_STATE_FONT_SIZE = 60;

    getInitialState(): OverlayState {
        return {
            'remainingTimeSec': null,
            'gameState': GameState.PRE_PLAY
        };
    }

    componentDidMount(): void {
        this.props.observables.onTimeUpdate.subscribe((remainingTimeSec: number) => {
            this.setState({
                'remainingTimeSec': remainingTimeSec,
                'gameState': remainingTimeSec ? GameState.PLAYING : GameState.GAME_OVER
            });
        });
        this.props.observables.onGoal.subscribe(() => {
            this.setState({
                'remainingTimeSec': this.state.remainingTimeSec,
                'gameState': GameState.GOAL
            });
        });
        this.props.observables.onStartDance.subscribe(() => {
            this.setState({
                'remainingTimeSec': this.state.remainingTimeSec,
                'gameState': GameState.DANCING
            });
        });
    }

    render(): React.ReactElement<any> {
        return React.DOM.div(
            {'style': {
                'position': 'fixed',
                'width': this.props.size + 'px',
                'height': this.props.size + 'px',
                'textAlign': 'center',
                'zIndex': this.state.gameState === GameState.DANCING ? -1 : 1
            }},
            React.DOM.span(
                {'style': {'fontSize': Overlay.TIMER_FONT_SIZE + 'px', 'display': 'block'}},
                this.state.remainingTimeSec
            ),
            this.createGameStateSpan(this.state.gameState)
        );
    }

    private createGameStateSpan(gameState: GameState): React.DOMElement<any> {
        var marginTop = (this.props.size - Overlay.GAME_STATE_FONT_SIZE) / 2,
            style = {'style': {
                'marginTop': marginTop + 'px',
                'display': 'block',
                'fontSize': Overlay.GAME_STATE_FONT_SIZE + 'px',
                'backgroundColor': 'black',
                'color': null
            }};
        switch (gameState) {
            case GameState.PRE_PLAY:
            case GameState.PLAYING:
            case GameState.DANCING:
                return null;
            case GameState.GOAL:
                style.style.color = '#CCFF66';
                return React.DOM.span(style, 'GOAL!!!');
            case GameState.GAME_OVER:
                style.style.color = '#FF6666';
                return React.DOM.div(style,
                    React.DOM.p(null, 'GAME OVER'),
                    React.DOM.p(null, 'Reload to retry')
                );
        }
    }
}

export var component = TypedReact.createClass(Overlay);
