import Expo from 'expo'
import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Button,
  Linking,
  AsyncStorage
} from 'react-native'
import { gql, graphql, compose } from 'react-apollo'
import {
  EXPO_LOCAL_TUNNEL_URI,
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID
} from 'react-native-dotenv'

let redirectUri
if (Expo.Constants.manifest.xde) {
  // Hi there, dear reader!
  // This value needs to be the tunnel url for your local Expo project.
  // It also needs to be listed in valid callback urls of your Auth0 Client
  // Settings. See the README for more information.
  redirectUri = EXPO_LOCAL_TUNNEL_URI
} else {
  redirectUri = `${Expo.Constants.linkingUri}/redirect`
}

const queryUser = gql`
  query {
    user {
      id
    }
  }`

const createUserMutation = gql`
  mutation createUser($idToken: String!) {
    createUser(
      authProvider: {
        auth0: {
          idToken: $idToken
        }
      }
    ){  
      id
    }
  }`

class Login extends React.Component {
  componentDidMount () {
    Linking.addEventListener('url', this._handleAuth0Redirect)
  }

  _logout = async () => {
    AsyncStorage.removeItem('token')
    this.props.queryUser.refetch()
  }

  _loginWithAuth0 = async () => {
    const redirectionURL =
      `${AUTH0_DOMAIN}/authorize` +
      this._toQueryString({
        client_id: AUTH0_CLIENT_ID,
        response_type: 'token',
        scope: 'openid name',
        redirect_uri: redirectUri,
        state: redirectUri
      })
    Expo.WebBrowser.openBrowserAsync(redirectionURL)
  }

  _handleAuth0Redirect = async event => {
    if (!event.url.includes('+/redirect')) {
      return
    }
    Expo.WebBrowser.dismissBrowser()
    const [, queryString] = event.url.split('#')
    const responseObj = queryString.split('&').reduce((map, pair) => {
      const [key, value] = pair.split('=')
      map[key] = value // eslint-disable-line
      return map
    }, {})
    const encodedToken = responseObj.id_token
    AsyncStorage.setItem('token', encodedToken)
    try {
      await this.props.createUser({
        variables: {
          idToken: encodedToken
        }
      })
    } catch (e) {
      // user exists
    }

    this.props.queryUser.refetch()
  }

  /**
   * Converts an object to a query string.
   */
  _toQueryString (params) {
    return (
      '?' +
      Object.entries(params)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join('&')
    )
  }

  render () {
    return (
      <View style={styles.container}>
        {this.props.queryUser.user
          ? <View>
            <Text style={styles.title}>
                Current user id: {this.props.queryUser.user.id}
            </Text>
            <Button title='Logout' onPress={this._logout} />
          </View>
          : <View>
            <Text style={styles.title}>Example: Auth0 login</Text>
            <Button title='Login with Auth0' onPress={this._loginWithAuth0} />
          </View>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 40
  }
})

export default compose(
  graphql(createUserMutation, { name: 'createUser' }),
  graphql(queryUser, { name: 'queryUser' })
)(Login)
