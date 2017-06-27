import React               from 'react'
import ReactDOM            from 'react-dom';
import {NodeSelectionList} from './mNodeSelectionList'


export class NewNodeDialog extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            filterString : "",
            selectionKey : -1
        }
        this.state.filteredList = this.makeFilteredList("", this.props.availableNodes)
        this.inputElem = null
    }
    
    
    makeFilteredList(filterString, nodeList) {
        var filteredList = nodeList.map((x,i) => ({key:i, node:x}))
        if (filterString !== "") {
            filteredList = filteredList.filter(x => {
                return x.node.name.includes(filterString)
            })
        }
        return filteredList
    }
    
    
    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown);
        this.inputElem.focus()
    }
    
    
    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown)
    }
    
    
    onInputChanged = (evt) => {
        var val = evt.target.value
        this.setState(prevState => {
            var s = {
                filterString : val,
                filteredList : this.makeFilteredList(val, this.props.availableNodes)
            }
            
            if (s.filteredList.findIndex(x => x.key === prevState.selectionKey) < 0) {
                if (s.filteredList.length > 0) {
                    s.selectionKey = s.filteredList[0].key
                } else {
                    s.selectionKey = -1
                }
            }
            
            return s
        })
    }
    
    
    onListSelectionChanged = (selectionKey) => {
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
        
        return (
            <div className="NewNodeDialog" onKeyDown={this.onKeyDown}>
                <input type="text" className="FunctionNameInput"
                    onChange={this.onInputChanged}
                    ref={elem => {this.inputElem = elem}}/>
                <NodeSelectionList
                    nodeList={this.state.filteredList}
                    filterString={this.state.filterString}
                    selectionKey={this.state.selectionKey}
                    onListSelectionChanged={this.onListSelectionChanged}/>
            </div>
        )
    }
    
}