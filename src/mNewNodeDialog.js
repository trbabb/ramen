import React from 'react'

export class NewNodeDialog extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }
    
    
    render() {
        return (
            <div className="NewNodeDialog">
                <table>
                {this.props.availableNodes.map(x => {return <tr><td>{x.name}</td></tr>})}
                </table>
            </div>
        )
    }
    
}
