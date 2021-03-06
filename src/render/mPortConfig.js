import React    from 'react';
import ReactDOM from 'react-dom';
import * as _   from 'lodash'

import gearImg   from '../resource/gear.png'

export class PortConfig extends React.PureComponent {
    render() {
        var classes = ["PortConfig", this.props.is_sink ? "Sink" : "Source"]
        return (
            <img
                src={gearImg}
                width={16} height={16}
                className={classes.join(" ")}
                draggable="false"
                onClick={(evt) => {
                    var e = {def_id    : this.props.def_id,
                             is_sink   : this.props.is_sink,
                             elem      : this.elem,
                             mouse_evt : evt}
                    this.props.handlePortConfigClick(e);
                }}
                ref={(e) => {
                    this.elem = e;
                }} />
        );
    }
}
