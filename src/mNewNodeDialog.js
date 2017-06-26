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
                <table><tbody>
                {this.props.availableNodes.map(x => {return <tr key={x.name}><td>{x.name}</td></tr>})}
                </tbody></table>
            </div>
        )
    }
    
}
