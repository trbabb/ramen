import React        from 'react'
import {Port}       from './mPort'
import portAddImage from '../resource/gear.png'

export class PortRack extends React.PureComponent {
    
    render() {
        var port_objs = this.props.ports
        var ports = []
        var self  = this
        var prtadd = null
        
        // emit all the ports
        port_objs.forEach((type_obj, port_id) => {
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
                    type_id     = {type_obj.code}
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
                alt={"add a port"}
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