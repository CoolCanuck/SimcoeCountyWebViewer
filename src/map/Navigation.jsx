import React, { Component } from "react";
import "./Navigation.css";
import { fromLonLat } from "ol/proj";
import * as helpers from "../helpers/helpers";
import { FaForward, FaBackward } from "react-icons/fa";
import Graticule from "ol/layer/Graticule";
import { Stroke } from "ol/style.js";
import { MdGridOn, MdGridOff } from "react-icons/md";
class Navigation extends Component {
  constructor(props) {
    super(props);
    this.graticule = null;

    this.state = {
      containerClassName: "nav-container",
      showCurrentLocation: true,
      showZoomExtent: true,
      extentHistory: [0, 1],
      showGridButton: true,
      showGrid: false,
    };

    // LISTEN FOR SIDEPANEL CHANGES
    window.emitter.addListener("sidebarChanged", (isSidebarOpen) => this.sidebarChanged(isSidebarOpen));

    // LISTEN FOR HISTORY CHANGES
    window.emitter.addListener("extentHistoryChanged", (index, count) => this.extentHistoryChanged([index, count]));

    // LISTEN FOR CONTROL VISIBILITY CHANGES
    window.emitter.addListener("mapControlsChanged", (control, visible) => this.controlStateChange(control, visible));
  }

  componentDidMount() {
    helpers.waitForLoad(["settings", "map"], Date.now(), 30, () => {
      this.graticule = new Graticule({
        // the style to use for the lines, optional.
        strokeStyle: new Stroke({
          color: "rgba(255,120,0,0.9)",
          width: 2,
          lineDash: [0.5, 4],
        }),
        showLabels: true,
        wrapX: false,
        zIndex: 10000,
      });
    });
    this.setState({
      showCurrentLocation: window.mapControls && window.mapControls.currentLocation,
      showZoomExtent: window.mapControls && window.mapControls.zoomExtent,
      showGridButton: window.mapControls && window.mapControls.showGrid,
    });
  }

  extentHistoryChanged(extentHistory) {
    this.setState({ extentHistory });
  }
  // ZOOM TO FULL EXTENT
  zoomFullExtent() {
    helpers.waitForLoad("settings", Date.now(), 30, () => {
      let centerCoords = window.config.centerCoords;
      let defaultZoom = window.config.defaultZoom;
      window.map.getView().animate({ center: centerCoords, zoom: defaultZoom });
    });
  }
  showGrid = () => {
    this.setState({ showGrid: !this.state.showGrid }, () => {
      if (this.state.showGrid) window.map.addLayer(this.graticule);
      else window.map.removeLayer(this.graticule);
    });
  };
  // ZOOM TO CURRENT LOCATION
  zoomToCurrentLocation() {
    var options = { timeout: 5000 };
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        const coords = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
        helpers.flashPoint(coords);
      },
      (err) => {
        helpers.showMessage("Location", "Getting your location failed: " + err.message);
      },
      options
    );

    helpers.addAppStat("Current Location", "Click");
  }

  // HANDLE SIDEBAR CHANGES
  sidebarChanged(isSidebarOpen) {
    //  SIDEBAR IN AND OUT
    if (isSidebarOpen) {
      this.setState({
        containerClassName: "nav-container nav-container-slideout",
      });
    } else {
      this.setState({
        containerClassName: "nav-container nav-container-slidein",
      });
    }
  }
  controlStateChange(control, state) {
    switch (control) {
      case "fullExtent":
        this.setState({ showZoomExtent: state });
        break;
      case "zoomToCurrentLocation":
        this.setState({ showCurrentLocation: state });
        break;
      case "showExtent":
        this.setState({ showGridButton: state });
        break;
      default:
        break;
    }
  }

  render() {
    return (
      <div>
        <div className="map-theme">
          <div className={this.state.containerClassName}>
            <div
              className="zoomButton"
              title="Zoom In"
              onClick={() => {
                window.map.getView().setZoom(window.map.getView().getZoom() + 1);
              }}
            >
              +
            </div>
            <div
              className="zoomButton"
              title="Zoom Out"
              onClick={() => {
                window.map.getView().setZoom(window.map.getView().getZoom() - 1);
              }}
            >
              -
            </div>
            <div className="extentHistory">
              <div
                className={`prevExtentButton ${this.state.extentHistory[0] === 0 ? "disabled" : ""}`}
                title="Previous Extent"
                onClick={() => {
                  helpers.addAppStat("ExtentHistory", "Button press previous");
                  helpers.extentHistory("previous");
                }}
              >
                <FaBackward size={15} />
              </div>
              <div
                className={`nextExtentButton ${this.state.extentHistory[0] === this.state.extentHistory[1] - 1 ? "disabled" : ""}`}
                title="Next Extent"
                onClick={() => {
                  helpers.addAppStat("ExtentHistory", "Button press next");
                  helpers.extentHistory("next");
                }}
              >
                <FaForward size={15} />
              </div>
            </div>

            <div className="fullExtentButton" onClick={this.zoomFullExtent}>
              <div className="fullExtentContent" />
            </div>
            <div className="zoomToCurrentLocationButton" onClick={this.zoomToCurrentLocation}>
              <div className="zoomToCurrentLocationContent" />
            </div>
            <div className="showGridButton" onClick={this.showGrid} title={`${this.state.showGrid ? "Hide" : "Show"} map grid`}>
              <div className={`showGridContent${this.state.showGrid ? " active" : ""}`}>
                {this.state.showGrid ? <MdGridOff size={25} color={"#838383"} /> : <MdGridOn size={25} color={"#838383"} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Navigation;
