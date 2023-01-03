import reactCSS from "reactcss"

let screenSize = {
  width: 3840,
  height: 2160,
}

if (typeof window !== "undefined") {
  screenSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

export const styles = reactCSS({
  default: {
    righticons: {
      border: "none",
      width: `${screenSize.width * 0.06}px`,
      height: `${screenSize.height * 0.09}px`,
      background: "none",
      borderRadius: "0.1%",
      outline: "none",
      padding: "0.5%",
    },
    topicons: {
      border: "none",
      width: `${screenSize.width * 0.073}px`,
      height: `${screenSize.height * 0.09}px`,
      background: "none",
      borderRadius: "0.1%",
      outline: "none",
      padding: "0.5%",
    },
    picker: {
      border: "none",
      backgroundImage:
        "linear-gradient(to bottom right, #b827fc 0%, #2c90fc 25%, #b8fd33 50%, #fec837 75%, #fd1892 100%)",
      width: `${screenSize.width * 0.073 * 0.5}px`,
      height: `${screenSize.width * 0.073 * 0.5}px`,
      borderRadius: "7%",
      outline: "none",
      filter: "blur(0.5px)",
      padding: "0.5%",
      marginTop:
        screenSize.width <= 1024 //320
          ? `${screenSize.height - screenSize.height * 0.981}px`
          : `${screenSize.height - screenSize.height * 0.999}px`,
    },
  },
})
