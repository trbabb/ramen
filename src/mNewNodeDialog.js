import React               from 'react'
import ReactDOM            from 'react-dom';
import {NodeSelectionList} from './mNodeSelectionList'


export class NewNodeDialog extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            filterString   : "",
            selectionKey : -1
        }
        this.inputElem = null
    }
    
    
    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown);
        this.inputElem.focus()
    }
    
    
    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown)
    }
    
    
    onListSelectionChanged = (selectionKey) => {
        console.log("setting state?", selectionKey)
        this.setState({selectionKey : selectionKey})
    }
    
    
    onKeyDown = (evt) => {
        if (evt.key === 'Enter') {
            if (this.state.selectionKey >= 0) {
                var retNode = this.props.availableNodes[this.state.selectionKey]
                this.props.onNodeCreate(retNode)
            } else {
                // nothing selected
                this.props.onNodeCreate(null)
            }
        } else if (evt.key === 'Escape') {
            // canceled by user
            this.props.onNodeCreate(null)
        }
    }
    
    
    render() {
        var filteredList = this.props.availableNodes.map((x,i) => ({key:i, node:x}))
        if (this.props.filterString !== "") {
            filteredList = filteredList.filter(x => {
                return x.node.name.includes(this.state.filterString)
            })
        }
        return (
            <div className="NewNodeDialog" onKeyDown={this.onKeyDown}>
                <input type="text" className="FunctionNameInput"
                    onChange={evt => {this.setState({filterString : evt.target.value})}}
                    ref={elem => {this.inputElem = elem}}/>
                <NodeSelectionList
                    nodeList={filteredList}
                    filterString={this.state.filterString}
                    onListSelectionChanged={this.onListSelectionChanged}/>
            </div>
        )
    }
    
}