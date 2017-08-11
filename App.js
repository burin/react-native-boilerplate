import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AsyncStorage } from 'react-native'
import {
  ApolloProvider,
  createNetworkInterface,
  ApolloClient
} from 'react-apollo'

import Login from './src/Login'
import { SIMPLE_API_ENDPOINT } from 'react-native-dotenv'

const networkInterface = createNetworkInterface({
  uri: SIMPLE_API_ENDPOINT
})

networkInterface.use([
  {
    applyMiddleware (req, next) {
      if (!req.options.headers) {
        req.options.headers = {} // Create the header object if needed.
      }

      AsyncStorage.getItem('token').then(
        encodedToken => {
          req.options.headers['authorization'] = `Bearer ${encodedToken}`
          next()
        },
        failure => {
          console.error('ERROR: no token', failure)
          next()
        }
      )
    }
  }
])

const client = new ApolloClient({ networkInterface })

export default class App extends React.Component {
  render () {
    return (
      <ApolloProvider client={client}>
        <View style={styles.container}>
          <Login />
        </View>
      </ApolloProvider>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
