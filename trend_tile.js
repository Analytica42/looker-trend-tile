looker.plugins.visualizations.add({
  id: "trend_tile",
  label: "Trend Tile",
  options: {
    primary_text: {
      type: "string",
      label: "Primary Text",
      default: "Primary Text"
    },
    secondary_text: {
      type: "string",
      label: "Secondary Text",
      default: "Secondary Text"
    },
    primary_color: {
      type: "string",
      label: "Primary Text Color",
      display: "color",
      default: "#342bc2"
    },
    secondary_color: {
      type: "string",
      label: "Secondary Text Color",
      display: "color",
      default: "#808080"
    },
    positive_color: {
      type: "string",
      label: "Positive Trend Color",
      display: "color",
      default: "#93bf36"
    },
    negative_color: {
      type: "string",
      label: "Negative Trend Color",
      display: "color",
      default: "#FF0000"
    },
    value_format: {
      type: "string",
      label: "Value Format",
      default: "0.[0]a"
    },
    show_difference: {
      type: "boolean",
      label: "Show Difference",
      default: true
    },
    difference_format: {
      type: "string",
      label: "Difference Format",
      display: "select",
      values: [
        { "Percent": "percent" },
        { "Absolute": "absolute" }
      ],
      default: "percent"
    }
  },

  // Set up the initial state of the visualization
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .tile-container {
          font-family: Arial, sans-serif;
          text-align: left;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        .tile-primary {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
          color: ${config.primary_color};
        }
        .value-trend-container {
          display: flex;
          align-items: center;
        }
        .tile-value {
          font-size: 28px;
          font-weight: bold;
          color: black;
          margin-right: 5px;
          overflow: hidden;
        }
        .tile-trend {
          font-size: 24px;
          overflow: hidden;
        }
        .secondary-container {
          display: flex;
          align-items: center;
          margin-top: 5px;
        }
        .tile-secondary {
          font-size: 14px;
          color: ${config.secondary_color};
          overflow: hidden;
        }
        .tile-trend-secondary {
          margin-left: 5px;
          font-size: 14px;
          overflow: hidden;
        }
        .positive-trend {
          color: ${config.positive_color};
        }
        .negative-trend {
          color: ${config.negative_color};
        }
      </style>
    `;

    // Create container elements for the tile visualization.
    this._container = element.appendChild(document.createElement("div"));
    this._container.className = "tile-container";

    this._primaryElement = this._container.appendChild(document.createElement("div"));
    this._primaryElement.className = "tile-primary";

    const valueAndTrendContainer = this._container.appendChild(document.createElement("div"));
    valueAndTrendContainer.className = "value-trend-container";

    this._valueElement = valueAndTrendContainer.appendChild(document.createElement("span"));
    this._valueElement.className = "tile-value";

    this._trendElement = valueAndTrendContainer.appendChild(document.createElement("span"));
    this._trendElement.className = "tile-trend";

    this._secondaryContainer = this._container.appendChild(document.createElement("div"));
    this._secondaryContainer.className = "secondary-container";

    this._secondaryElement = this._secondaryContainer.appendChild(document.createElement("span"));
    this._secondaryElement.className = "tile-secondary";

    this._secondaryTrend = this._secondaryContainer.appendChild(document.createElement("span"));
    this._secondaryTrend.className = "tile-trend-secondary";
  },

  // Render in response to data or settings changes
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    if (queryResponse.fields.measures.length < 2) {
      this.addError({title: "Insufficient Data", message: "This visualization requires two measures."});
      return;
    }

    // Assume the first measure is the current value, and the second measure is the previous value
    const currentMeasure = queryResponse.fields.measures[0].name;
    const previousMeasure = queryResponse.fields.measures[1].name;

    const currentValue = data[0][currentMeasure].value;
    const previousValue = data[0][previousMeasure].value;
    const percentageDifference = ((currentValue - previousValue) / previousValue) * 100;
    const absoluteDifference = currentValue - previousValue;

    // Format the value based on the value_format option using spreadsheet-style formatting
    function formatValue(value) {
      if (config.value_format) {
        return numeral(value).format(config.value_format);
      } else {
        return numeral(value);
      }
    }

    // Update the primary text, value, and secondary text
    this._primaryElement.innerText = config.primary_text;
    this._primaryElement.style.color = config.primary_color;

    // Add the trend arrow after the current value
    const arrow = percentageDifference >= 0 ? '▲' : '▼';
    const trendColor = percentageDifference >= 0 ? config.positive_color : config.negative_color;
    this._valueElement.innerHTML = `${formatValue(currentValue)}`;
    this._trendElement.innerHTML = `<span style="color: ${trendColor};">${arrow}</span>`;

    // Update secondary text and color it based on the secondary color
    this._secondaryElement.innerText = `${config.secondary_text} ${formatValue(previousValue)}`;
    this._secondaryElement.style.color = config.secondary_color;

    // Show the difference if enabled
    if (config.show_difference) {
      let differenceText = "";
      if (config.difference_format === "percent") {
        differenceText = `(${percentageDifference.toFixed(1)}%)`;
      } else if (config.difference_format === "absolute") {
        differenceText = `(${formatValue(absoluteDifference)})`;
      }
      this._secondaryTrend.innerHTML = differenceText;
      this._secondaryTrend.style.color = trendColor;
    } else {
      this._secondaryTrend.innerHTML = "";
    }

    done();
  }
});
