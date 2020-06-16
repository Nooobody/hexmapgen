import React from 'react';
import { Stage, Layer, Rect, Shape, Circle, Line } from 'react-konva'
import Grid from './grid'

const canvasWidth = window.innerWidth - 20
const canvasHeight = window.innerHeight - 30
const screenRatio = window.innerHeight / window.innerWidth

const gridWidth = 80
const gridHeight = Math.round(80 * screenRatio)

const fogOfWar = false

class App extends React.Component {
  state = {
    grid: new Grid(gridWidth, gridHeight, canvasWidth, canvasHeight, (grid) => this.setState({ actualGrid: grid }), (obj) => this.setState(obj)),
    actualGrid: [],
    selected: undefined,
    neighbors: [],
    explored: [],
    borders: [],
    mapScale: 4,
    mapOffset: [20, 20]
  }

  componentDidMount() {
    this.state.grid.initializeGround()
    window.addEventListener('mousewheel', this.mapZoom)
  }

  componentWillUnmount() {
    window.removeEventListener('mousewheel', this.mapZoom)
  }

  drawHex = (point, ctx, shape) => {
    const { canvasX, canvasY } = point
    ctx.beginPath()

    const distX = (canvasWidth / gridWidth) / 2
    const distY = (canvasHeight / gridHeight) / 2
    const addX = distX / 3
    // const addX = 0

    ctx.moveTo(canvasX + distX + addX, canvasY)
    ctx.lineTo(canvasX + distX / 3 + addX, canvasY + distY)
    ctx.lineTo(canvasX - distX / 3 - addX, canvasY + distY)
    ctx.lineTo(canvasX - distX - addX, canvasY)
    ctx.lineTo(canvasX - distX / 3 - addX, canvasY - distY)
    ctx.lineTo(canvasX + distX / 3 + addX, canvasY - distY)
    ctx.closePath()

    ctx.fillStrokeShape(shape)
  }

  clickHex = (v) => {
    console.log(v)
    this.setState({ 
      selected: v,
      explored: this.state.grid.getAllAtRange(v, 3)
    })
  }

  getFill = (point) => {
    const { explored, selected } = this.state
    if (!fogOfWar || explored.includes(point)) {
      if (selected === point) {
        return 'red'
      }
      else {
        return point.fill
      }
    }
    else {
      return 'black'
    }
  }

  getStroke = (point) => {
    const { explored } = this.state
    if (!fogOfWar || explored.includes(point)) {
      return point.stroke
    }
    else {
      return 'black'
    }
  }

  boundX = (x, scale) => {
    const { mapScale } = this.state
    scale = scale || mapScale
    const width = (canvasWidth - canvasWidth / scale) * -scale
    const topLeft = 20 * scale
    return x < width ? width : x > topLeft ? topLeft : x
  }

  boundY = (y, scale) => {
    const { mapScale } = this.state
    scale = scale || mapScale
    const height = (canvasHeight - canvasHeight / scale) * -scale
    const topLeft = 20 * scale
    return y < height ? height : y > topLeft ? topLeft : y
  }

  mapBounds = (pos) => {
    return {
      x: this.boundX(pos.x),
      y: this.boundY(pos.y)
    }
  }

  mapZoom = (e) => {
    const zoomingOut = e.deltaY > 0
    const { mapScale, mapOffset } = this.state
    if (zoomingOut && mapScale > 1) {
      this.setState({ 
        mapScale: mapScale - 1,
        mapOffset: mapScale - 1 === 1 ? [20, 20] : [this.boundX(mapOffset[0], mapScale - 1), this.boundY(mapOffset[1], mapScale - 1)]
      })
    }
    else if (!zoomingOut && mapScale < 4) {
      const newScale = mapScale + 1
      const mouseOffset = [-e.x * mapScale, -e.y * mapScale]
      this.setState({ 
        mapScale: newScale,
        mapOffset: [this.boundX(mouseOffset[0], newScale), this.boundY(mouseOffset[1], newScale)]
      })
    }
  }

  renderMap(grid) {
    return grid.map(v => (
      <Shape
        key={`${v.x}-${v.y}`}
        sceneFunc={(ctx, shape) => this.drawHex(v, ctx, shape)}
        fill={this.getFill(v)}
        stroke={this.getStroke(v)}
        strokeWidth={1}
        onClick={() => this.clickHex(v)}
      />
    ))
  }

  renderBorder = (line, ind) => {
    const points = [...line[0], ...line[1]]
    return <Line key={ind} points={points} stroke="black" strokeWidth={1} />
  }

  render () {
    const { actualGrid, borders, mapScale, mapOffset } = this.state
    const flattened = this.state.grid.flattenGrid(actualGrid)
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Rect x={0} y={0} width={window.innerWidth} height={window.innerHeight} fill="lightblue"></Rect>
        </Layer>
        <Layer 
          x={mapOffset[0]} 
          y={mapOffset[1]} 
          width={canvasWidth} 
          height={canvasHeight} 
          scaleX={mapScale} 
          scaleY={mapScale} 
          draggable
          dragBoundFunc={this.mapBounds}
          onDragEnd={(e) => this.setState({ mapOffset: [e.target.x(), e.target.y()]})}
        >
          { this.renderMap(flattened) }
          { borders.map(this.renderBorder) }
          {/* { flattened.map(v => <Circle x={v.canvasX} y={v.canvasY} radius={5} fill="green" />)} */}
        </Layer>
      </Stage>
    );
  }
}

export default App;
