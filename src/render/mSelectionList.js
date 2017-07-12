import React from 'react'


export class SelectionList extends React.Component {
    
    
    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown);
        this.setFirstItemSelected()
    }
    
    
    setFirstItemSelected() {
        var selectionKey = this.props.itemList[0].key
        this.props.onListSelectionChanged(selectionKey)
    }
    
    
    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown)
    }
    
    
    onKeyDown = (evt) => {
        if (evt.key === "ArrowDown" || evt.key === "ArrowUp") {
            var curIdx = this.props.itemList.findIndex(x => x.key === this.props.selectionKey)
            var newIdx = -1
            if (evt.key === "ArrowDown") {
                newIdx = curIdx + 1
            } else if (evt.key === "ArrowUp") {
                // pick previous key in list
                newIdx = curIdx - 1
            }
            var b = this.props.itemList.length
            newIdx = (newIdx % b + b) % b // newIdx in range [0, list.length)
            this.props.onListSelectionChanged(this.props.itemList[newIdx].key)
        }
    }
    
    
    onMouseOverElement = (evt,key) => {
        this.props.onListSelectionChanged(key)
    }
    
    
    render() {
        var elems = this.props.itemList.map((x,i) => {
                var className = "SelectionListElement"
                if (x.key === this.props.selectionKey) {
                    className += " Selected"
                }
                return <tr key={i} 
                        className={className}
                        onMouseOver={evt=>{this.onMouseOverElement(evt, x.key)}}
                        onKeyDown={this.onKeyDown}
                        onClick={this.props.onItemClicked}>
                    <td>{x.val}</td>
                </tr>
            })
        return (
            <table><tbody>
            {elems}
            </tbody></table>
        )
    }
    
}