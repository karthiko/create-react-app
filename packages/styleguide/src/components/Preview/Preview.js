import React, { Component } from 'react';
import {
  string,
  node,
  object,
  bool,
  func,
  arrayOf,
  oneOfType,
} from 'prop-types';
import cx from 'classnames';
import Select from 'react-select';
import styled from 'styled-components';
import chroma from 'chroma-js';

import PreviewTitleBar from './PreviewTitleBar';
import CodeExample from './CodeExample';
import Frame from './Frame';

import Card from './../Card';
import Icon from './../Icon';

import Button from './../Button';

const CLASS_ROOT = '';

function getBackgroundsAsArray(previewBackgrounds, excludedColors = []) {
  return Object.keys(previewBackgrounds)
    .filter(colorName => !excludedColors.includes(colorName))
    .map(key => ({
      value: previewBackgrounds[key],
      label: key,
    }));
}

class Preview extends Component {
  static displayName = 'Preview';

  static propTypes = {
    /** (deprecated) Title text for `Preview.` Instead of `title` prop, prefer regular html heading above `Preview`. */
    title: string,
    /** Pass custom code (JSX) which will be shown instead of visually previewed code. */
    code: oneOfType([node, func]),
    /** Pass [react-element-to-jsx-string](https://github.com/algolia/react-element-to-jsx-string) options to code preview. */
    codeJSXOptions: object,
    /** Default background color as color name. Must be one from passed `bgThemeColors`. To disable background color chooser, pass `false`. */
    bgTheme: oneOfType([string, bool]),
    /** Available background colors. Colors are inherithed from `theme.previewBackgrounds`. */
    bgThemeColors: object,
    /** Exclude colors from available background colors. */
    bgThemeExcludedColors: arrayOf(string),
    /** Disables code preview. */
    hasCodePreview: bool,
    /** Pass HTML as string to preview HTML code. */
    html: string,
    /** (unstable) Display preview in inframe. */
    isIframe: bool,
    /** (unstable) Iframe custom <head /> */
    iframeHead: node,
    /** (unstable) Iframe custom JavaScripts. */
    iframeScripts: string,
  };

  static defaultProps = {
    bgTheme: 'white',
    bgThemeColors: {
      white: '#fff',
    },
    bgThemeExcludedColors: [],
    hasCodePreview: true,
  };

  componentWillReceiveProps(props) {
    if (
      this.state.previewBackground &&
      props.bgTheme !== this.state.previewBackground.label
    ) {
      this.setState({
        previewBackground: {
          label: props.bgTheme,
          value: props.bgThemeColors[props.bgTheme],
        },
      });
    }
  }

  constructor(props) {
    super(props);

    this.handleToggleCode = this.handleToggleCode.bind(this);
    this.handlePreviewBackground = this.handlePreviewBackground.bind(this);
  }

  state = {
    isCodeShown: false,
    previewBackground: this.props.bgThemeColors
      ? {
          label: this.props.bgTheme,
          value: this.props.bgThemeColors[this.props.bgTheme],
        }
      : {},
  };

  handleToggleCode() {
    this.setState({
      isCodeShown: !this.state.isCodeShown,
    });
  }

  handlePreviewBackground = previewBackground => {
    this.setState({ previewBackground });
  };

  return;

  render() {
    const {
      children,
      className,
      title,
      code,
      codeJSXOptions,
      bgTheme,
      bgThemeColors,
      bgThemeExcludedColors,
      isIframe,
      iframeHead,
      iframeScripts,
      hasCodePreview,
      html,
      ...other
    } = this.props;

    const { previewBackground } = this.state;

    const classes = cx(CLASS_ROOT, className);

    const colourStyles = {
      option: (styles, { data, isActive }) => {
        const color = chroma(data.value);
        return {
          ...styles,
          backgroundColor: isActive ? 'black' : data.value,
          color: chroma.contrast(color, 'white') > 2 ? 'white' : 'black',
          cursor: 'pointer',
        };
      },
      container: () => {},
      control: () => {},
      valueContainer: () => {},
      singleValue: () => {},
      indicatorSeparator: () => {},
    };

    const actions = [];

    if (bgTheme && bgThemeColors) {
      const bgColorsOptions = getBackgroundsAsArray(
        bgThemeColors,
        bgThemeExcludedColors
      );

      if (bgColorsOptions.length) {
        actions.push(
          <StyledSelect
            name="background-select"
            className="select-wrapper"
            classNamePrefix="select"
            isSearchable={false}
            isClearable={false}
            value={previewBackground}
            placeholder={previewBackground.value}
            onChange={this.handlePreviewBackground}
            options={bgColorsOptions}
            styles={colourStyles}
          />
        );
      }
    }

    if (hasCodePreview) {
      actions.push(
        <Button onClick={this.handleToggleCode}>
          <Icon name="code" fill={bgThemeColors.accent || '#000'} />
          {this.state.isCodeShown ? 'HIDE CODE' : 'SHOW CODE'}
        </Button>
      );
    }

    const renderAsFunctionContext = {
      bgTheme: previewBackground.label,
      bgThemeValue: previewBackground.value,
    };

    const childrenToRender =
      typeof children === 'function'
        ? children(renderAsFunctionContext)
        : children;

    const toReneder = childrenToRender || (
      // eslint-disable-next-line react/no-danger
      <div dangerouslySetInnerHTML={{ __html: html }} />
    );

    const toCode =
      (code && typeof code === 'function'
        ? code(renderAsFunctionContext)
        : code) ||
      childrenToRender ||
      html;

    const content = isIframe ? (
      <Frame head={iframeHead} scripts={iframeScripts}>
        {toReneder}
      </Frame>
    ) : (
      toReneder
    );

    return [
      <PreviewTitleBar title={title} actions={actions} key="previewTitle" />,
      <Card
        className={classes}
        bgColor={previewBackground.value}
        {...other}
        key="previewCard"
      >
        <StyledPreviewLive>{content}</StyledPreviewLive>
        {this.state.isCodeShown &&
          hasCodePreview &&
          toCode && (
            <CodeExample
              {...(html ? { codeTypes: ['html'] } : {})}
              codeJSXOptions={codeJSXOptions}
            >
              {toCode}
            </CodeExample>
          )}
      </Card>,
    ];
  }
}

export default Preview;

const StyledPreviewLive = styled.div`
  transition: all 200ms ease-in-out;
`;

const StyledSelect = styled(Select)`
  &.select-wrapper {
    position: relative;
    font-family: ${props => props.theme.fontFamily};
    font-size: 14px;
  }

  .select__control {
    cursor: pointer;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    min-width: 130px;
  }

  .select__value-container {
    display: inline-flex;
    justify-content: flex-end;
  }

  .select__single-value,
  .select__option {
    text-transform: uppercase;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select__menu {
    border-radius: 0 !important;
    text-align: center;
  }
`;
