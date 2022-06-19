import React, { Component } from 'react';
import { GridGenerator, Layout, Hexagon, Text, Pattern, HexUtils } from 'react-hexgrid';
import './TeacherLayout.css';

class TeacherLayout extends Component {
  constructor(props) {
    super(props);
    // Initialize hexagons with some text and image
    const hexagons = GridGenerator.rectangle(2,1).map((hexagon, index) => {
      return Object.assign({}, hexagon, {
        text: `Queen ${index+1}`,
        image: `https://media.istockphoto.com/vectors/cartoon-happy-bee-waving-hand-vector-id995810872`
      });
    })
    this.state = { hexagons };
  }

  onDragStart(event, source) {
    // Could do something on onDragStart as well, if you wish
  }

  // onDragEnd you can do some logic, e.g. to clean up hexagon if drop was success
  onDragEnd(event, source, success) {
    if (!success) {
      return;
    }
    const { hexagons } = this.state;
    // TODO Drop the whole hex from array, currently somethings wrong with the patterns
    // const hexas = hexagons.filter(hex => !HexUtils.equals(targetHex, hex));
    const hexas = hexagons.map(hex => {
      if (HexUtils.equals(source.state.hex, hex)) {
        hex.text = null;
        hex.image = null;
      }
      return hex;
    });
    this.setState({ hexagons: hexas });
  }

  render() {
    const { hexagons } = this.state;
    return (
      <Layout className="teacherTiles" size={{ x: 8, y: 8 }} flat={false} spacing={1.01} origin={{ x: 40, y: -20 }}>
        {
          hexagons.map((hex, i) => (
            <Hexagon
              key={i}
              q={hex.q}
              r={hex.r}
              s={hex.s}
              fill={(hex.image) ? HexUtils.getID(hex) : null}
              data={hex}
              onDragStart={(e, h) => this.onDragStart(e, h)}
              onDragEnd={(e, h, s) => this.onDragEnd(e, h, s)}
            >
              <Text>{hex.text}</Text>
              { !!hex.image && <Pattern id={HexUtils.getID(hex)} link={hex.image} /> }
            </Hexagon>
          ))
        }
      </Layout>
    );
  }
}

export default TeacherLayout;


