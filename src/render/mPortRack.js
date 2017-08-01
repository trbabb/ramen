import React        from 'react'
import {Port}       from './mPort'
import portAddImage from '../resource/gear.png'

export class PortRack extends React.PureComponent {
    
    render() {
        var sig   = this.props.def.type_sig
        var ids   = this.props.is_sink ? sig.sink_ids : sig.src_ids
        var ports = []
        var self  = this
        var prtadd = null
        
        // emit all the ports
        ids.forEach(port_id => {
            var type_id     = sig.type_by_port_id.get(port_id)
            var edit_target = null
            if (this.props.target) {
                edit_target = {
                    def_id  : this.props.target,
                    port_id : port_id,
                    is_arg  : !self.props.is_sink
                }
            }
            ports.push(
                <Port
                    key         = {port_id}
                    port_id     = {port_id}
                    node_id     = {self.props.node_id}
                    type_id     = {self.props.types.get(type_id).code}
                    direction   = {self.props.is_sink ? [0,-1] : [0, 1]}
                    is_sink     = {self.props.is_sink}
                    edit_target = {edit_target}
                    cbacks      = {self.props.cbacks}/>
            )
        })
        
        // add the "add port" button
        if (this.props.target) {
            prtadd = <img
                src={portAddImage}
                width={16} height={16}
                className="PortConfig"
                draggable="false"
                onClick={e => {
                    this.props.cbacks.onPortConfigClick({
                        def_id : this.props.target,
                        is_sink : this.props.is_sink,
                        mouse_evt : e
                    })
                }}/>
        }
        
        return (
            <div className="PortRack">
                {ports}
                {prtadd}
            </div>
        )
    }
    
}