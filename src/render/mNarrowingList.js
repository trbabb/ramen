import React               from 'react'
import {SelectionList} from './mSelectionList'



export class NarrowingList extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            filterString : "",
            selectionKey : null,
            filteredList : this.makeFilteredList("", this.props.items),
        }
        this.inputElem = null
    }
    
    
    makeFilteredList(filterString, itemList) {
        var stringy = this.props.stringifier
        if (!stringy) {
            stringy = (v) => v
        }
        var filteredList = itemList.map((x,i) => ({key:i, val:stringy(x)})).toArray()
        if (filterString !== "") {
            filteredList = filteredList.filter(x => {
                return x.val.toLowerCase().includes(filterString.toLowerCase())
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
                filteredList : this.makeFilteredList(val, this.props.items)
            }
            
            // has the current selction disappeared from underneath us?
            if (s.filteredList.findIndex(x => x.key === prevState.selectionKey) < 0) {
                if (s.filteredList.length > 0) {
                    // the previous selection was just filtered out.
                    // select whatever the first thing is.
                    s.selectionKey = s.filteredList[0].key
                } else {
                    // nothing in the list; select nothing
                    s.selectionKey = null
                }
            }
            
            return s
        })
    }
    
    
    onListSelectionChanged = (selectionKey) => {
        this.setState({selectionKey : selectionKey})
        if (this.props.onListSelectionChanged) {
            this.props.onListSelectionChanged(selectionKey)
        }
    }
    
    
    accept = () => {
        if (this.state.selectionKey !== null) {
            this.props.onAccept(this.state.selectionKey)
        } else {
            // nothing selected
            this.props.onAccept(null)
        }
    }
    
    
    cancel = () => {
        this.props.onAccept(null)
    }
    
    
    onKeyDown = (evt) => {
        if (evt.key === 'Enter') {
            this.accept()
        } else if (evt.key === 'Escape') {
            // canceled by user
            this.cancel()
        }
    }
    
    
    render() {
        
        return (
            <div className={"NarrowingList " + this.props.className} onKeyDown={this.onKeyDown}>
                <input type="text" className="FilterInput"
                    onChange={this.onInputChanged}
                    ref={elem => {this.inputElem = elem}}/>
                <SelectionList
                    itemList={this.state.filteredList}
                    filterString={this.state.filterString}
                    selectionKey={this.state.selectionKey}
                    onListSelectionChanged={this.onListSelectionChanged}
                    onItemClicked={this.accept}/>
            </div>
        )
    }
    
}