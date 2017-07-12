import React           from 'react'
import {NarrowingList} from './mNarrowingList'


export class NewNodeDialog extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            selected_def : -1,
        }
        this.items = this.props.defs.map(def => def.name)
    }
    
    
    onListSelectionChanged = (selection_key) => {
        this.setState({
            selected_def : selection_key
        })
    }
    
    
    render() {
        
        return (
            <div className="NewNodeDialog">
                <NarrowingList 
                    items={this.items} 
                    onAccept={this.props.onAccept}
                    onListSelectionChanged={this.onListSelectionChanged}/>
            </div>
        )
    }
    
}