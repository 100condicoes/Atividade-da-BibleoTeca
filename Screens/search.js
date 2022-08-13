import React,{Component} from "react";
import { View, Text, StyleSheet } from "react-native";

export default class SearchScreen extends Component {
    render()  {
        return (
        <View style={styles.container}>
            <Text style={styles.text}>Tela de Pesquisa</Text>
        </View>
        )
    }
}



const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#5653d4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
        color: 'white',
        fontSize: 30
    }
  });