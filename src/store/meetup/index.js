import * as firebase from 'firebase'

export default {
  state: {
    loadedMeetups: [
      {
        imageUrl: 'https://www.dentons.com/-/media/images/website/background-images/offices/taipei/taipei_city_1900x1500px.jpg',
        id: 'SantoryuOgiRokudoTsuji12',
        title: 'Meetup in Taipei',
        date: new Date(),
        location: 'Taipei 101',
        description: 'It\'s a tall building in Taiwan'
      },
      {
        imageUrl: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2018/04/10/13/tokyo-main.jpg?width=1368&height=912&fit=bounds&format=pjpg&auto=webp&quality=70',
        id: 'GomuGomuNoGatling23',
        title: 'Meetup in Tokyo',
        date: new Date(),
        location: 'Mount Fuji',
        description: 'It\'s a mountain in Japan'
      },
      {
        imageUrl: 'https://lonelyplanetwp.imgix.net/2016/04/Santorini-53c9e0dca77b.jpg?fit=min&q=40&sharp=10&vib=20&w=1470',
        id: 'NinpoSantoryu34',
        title: 'Meetup in Santorini',
        date: new Date(),
        location: 'The Blue Roofed Building',
        description: 'It\'s an island in Greece'
      },
      {
        imageUrl: 'https://lonelyplanetwp.imgix.net/2016/04/Santorini-53c9e0dca77b.jpg?fit=min&q=40&sharp=10&vib=20&w=1470',
        id: 'GomuGomuNoGrizly45',
        title: 'Meetup in Amsterdam',
        date: new Date(),
        location: 'Red Light District',
        description: 'It\'s a well lit area in Amsterdam'
      }
    ]
  },
  mutations: {
    setLoadedMeetups (state, payload) {
      state.loadedMeetups = payload
    },
    createMeetup (state, payload) {
      state.loadedMeetups.push(payload)
    },
    updateMeetup (state, payload) {
      const meetup = state.loadedMeetups.find(meetup => {
        return meetup.id === payload.id
      })
      if (payload.title) {
        meetup.title = payload.title
      }
      if (payload.description) {
        meetup.description = payload.description
      }
      if (payload.date) {
        meetup.date = payload.date
      }
    }
  },
  actions: {
    loadMeetups ({commit}) {
      commit('setLoading', true)
      firebase.database().ref('meetups').once('value')
        .then((data) => {
          const meetups = []
          const obj = data.val()
          for (let key in obj) {
            meetups.push({
              id: key,
              title: obj[key].title,
              description: obj[key].description,
              imageUrl: obj[key].imageUrl,
              date: obj[key].date,
              location: obj[key].location,
              creatorId: obj[key].creatorId
            })
          }
          commit('setLoadedMeetups', meetups)
          commit('setLoading', false)
        })
        .catch(
          (error) => {
            console.log(error)
            commit('setLoading', true)
          }
        )
    },
    createMeetup ({commit, getters}, payload) {
      const meetup = {
        title: payload.title,
        location: payload.location,
        description: payload.description,
        date: payload.date.toISOString(),
        creatorId: getters.user.id
      }
      let imageUrl
      let key
      firebase.database().ref('meetups').push(meetup)
        .then((data) => {
          key = data.key
          return key
        })
        .then(key => {
          const filename = payload.image.name
          const ext = filename.slice(filename.lastIndexOf('.'))
          return firebase.storage().ref('meetups/' + key + '.' + ext).put(payload.image)
        })
        .then(filedata => {
          let imagePath = filedata.metadata.fullPath
          // creating ref to our image file and get the url
          return firebase.storage().ref().child(imagePath).getDownloadURL()
        })
        .then(url => {
          imageUrl = url
          return firebase.database().ref('meetups').child(key).update({imageUrl: imageUrl})
        })
        .then(() => {
          commit('createMeetup', {
            ...meetup,
            imageUrl: imageUrl,
            id: key
          })
        })
        .catch((error) => {
          console.log(error)
        })
      // Reach out to Firebase and store it
    },
    updateMeetupData ({commit}, payload) {
      commit('setLoading', true)
      const updateObj = {}
      if (payload.title) {
        updateObj.title = payload.title
      }
      if (payload.description) {
        updateObj.description = payload.description
      }
      if (payload.date) {
        updateObj.date = payload.date
      }
      firebase.database().ref('meetups').child(payload.id).update(updateObj)
        .then(() => {
          commit('setLoading', false)
          commit('updateMeetup', payload)
        })
        .catch(error => {
          console.log(error)
          commit('setLoading', false)
        })
    }
  },
  getters: {
    loadedMeetups (state) {
      return state.loadedMeetups.sort((meetupA, meetupB) => {
        return meetupA.date > meetupB.date
      })
    },
    featuredMeetups (state, getters) {
      return getters.loadedMeetups.slice(0, 5)
    },
    loadedMeetup (state) {
      return (meetupId) => {
        return state.loadedMeetups.find((meetup) => {
          return meetup.id === meetupId
        })
      }
    }
  }
}
