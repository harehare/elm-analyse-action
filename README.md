# Github Action for elm-analyse

This action elm-analyse for use in actions.

# Usage

`.github/workflows/main.yml`

```yaml
steps:
  - uses: actions/checkout@v1
  - uses: harehare/elm-analyse-action@v1
    with:
      elm_analyse_version: 0.16.5
      ignore_error: false
      working_directory: elm
```

![img](/assets/img/elm-analyse-action.png)

## License

[MIT](http://opensource.org/licenses/MIT)
