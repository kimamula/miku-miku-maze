/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../node_modules/typed-react/dist/typed-react.d.ts" />
'use strict';
import React = require('react');
import TypedReact = require('typed-react');
import Game = require('../actions/game');
import UnityChan = require('../stores/unity_chan');

export interface TopProps {
    observers: Game.Observers;
    observables: UnityChan.Observables;
}

interface TopState {
    visible: boolean;
}

class Top extends TypedReact.Component<TopProps, TopState> {
    getInitialState(): TopState {
        return {
            'visible': true
        }
    }
    componentDidMount(): void {
        this.props.observables.loadUnityChan.subscribe(() => {
            this.setState({
                'visible': false
            });
        });
    }

    render(): React.ReactElement<any> {
        return React.DOM.div(this.state.visible ? null : {'style': {'display': 'none'}},
            React.DOM.p(null, React.DOM.big(null, 'RUN')),
            React.DOM.p(null, React.DOM.big(null, 'Unity-chan')),
            React.DOM.p(null, React.DOM.big(null, 'RUN')),
            React.DOM.img({'src': 'http://unity-chan.com/images/imageLicenseLogo.png', 'alt': 'ユニティちゃんライセンス'}),
            React.DOM.p(null,
                'このゲームは、『',
                React.DOM.a({'href': 'http://unity-chan.com/contents/license_jp/', 'target': '_blank'}, 'ユニティちゃんライセンス'),
                '』で提供されています。'
            ),
            React.DOM.button({'className': 'btn btn-primary', 'onClick': () => {this.props.observers.startGame.onNext(null)}}, 'ゲームスタート'),
            React.DOM.img({'src': '/images/imgKohaku.png', 'alt': 'ユニティちゃん'})
        );
    }
}

module.exports = TypedReact.createClass(Top);
