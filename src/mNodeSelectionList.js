import React from 'react'

export class NodeSelectionList extends React.Component {
    
    
    constructor(props) {
        super(props)
        this.state = {
            selectionKey : -1
        }
    }
    
    
    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown);
        var selectionKey = this.props.nodeList[0].key
        this.setState({
            selectionKey : selectionKey
        })
        this.props.onListSelectionChanged(selectionKey)
    }
    
    
    componentDidUpdate(prevProps, prevState) {
        // if (this.state.stateSelectionKey !== prevState.selectionKey) {
        //     this.props.onListSelectionChanged(this.state.selectionKey)
        // }
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
                var className = "NodeListElemment"
                if (x.key === this.state.selectionKey) {
                    className += " Selected"
                    console.log("FOUND IT")
                }
                return <tr key={i}><td>{x.node.name}</td></tr>
            })
        return (
            <table><tbody>
            {elems}
            </tbody></table>
        )
    }
    
}