import React from 'react'

export class NodeSelectionList extends React.Component {
    
    
    constructor(props) {
        super(props)
    }
    
    
    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown);
        this.setFirstItemSelected()
    }
    
    
    setFirstItemSelected() {
        var selectionKey = this.props.nodeList[0].key
        this.props.onListSelectionChanged(selectionKey)
    }
    
    
    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown)
    }
    
    
    onKeyDown = (evt) => {
        
    }
    
    
    onMouseOverElement = (evt) => {
        
    }
    
    
    render() {
        var elems = this.props.nodeList.map((x,i) => {
                var className = "NodeListElement"
                if (x.key === this.props.selectionKey) {
                    className += " Selected"
                    console.log("FOUND IT")
                }
                return <tr key={i} className={className}><td>{x.node.name}</td></tr>
            })
        return (
            <table><tbody>
            {elems}
            </tbody></table>
        )
    }
    
}