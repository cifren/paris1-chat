## Config

``` js
var serverConfig = {
  ...
  group: {
    // The user can search only people from his group
    search_by_group: true,
    groups: {
      student: 'Etudiant',
      employee: 'Personnel',
      // This one will be instances of service, created dynamically by LDAP module
      service: 'Service'
    }
  },
  ...
}
```
