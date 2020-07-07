const width = 800;
const height = 600;
const margin = { top: 10, right: 30, bottom: 30, left: 30 };

const body = d3.select("#chart");
const svg = body
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("class", "line-chart")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//////////////////////////////////
//--------import data-------------
d3.csv("350Cinder.csv").then(function (data) {
  //--------clean data-------------
  data.forEach((d) => {
    return (
      (d.Price = +d.Price),
      ((d.Date_new = new Date(d.Date)), (d.Size = +d.Size))
    );
  });

  const filtered = data.filter((d) => {
    return (
      d.Site != "NULL" &&
      d.Size != "NULL" &&
      d.SKU != "NULL" &&
      d.ReleaseDate != "NULL"
    );
  });

  const group_by_size = d3
    .nest()
    .key((d) => {
      return d.Size;
    })
    .entries(filtered);

  //---add data range for biset
  group_by_size.forEach((d) => {
    let rObj = [];
    d.values.forEach((e) => {
      rObj.push(e.Date_new);
    });
    rObj.sort((a, b) => a - b);
    return (d.daterange = rObj);
  });

  //---order price by date so biset and actual price number matches
  group_by_size.forEach((d) => {
    d.values.sort((a, b) => {
      return a.Date_new - b.Date_new;
    });
  });
  //---order data by size number
  const sorted = [...group_by_size].sort((a, b) => {
    return a.key - b.key;
  });

  //--------x axis-------------
  const xScale = d3
    .scaleTime()
    .domain(
      d3.extent(filtered, (d) => {
        return d.Date_new;
      })
    )
    .range([0, width]);

  const xAxis = d3.axisBottom(xScale);
  svg
    .append("g")
    .attr("class", "x axis")
    .call(xAxis)
    .attr("transform", "translate(" + 0 + "," + height + ")");

  //--------y axis-------------
  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(filtered, (d) => {
        return d.Price;
      }),
    ])
    .range([height, 0]);

  const yAxis = d3.axisLeft(yScale).ticks(6);

  svg.append("g").attr("class", "y axis").call(yAxis);

  ////////////////////////////////////
  //--------default size-------------
  //----select dropdown------
  const selectedElement = d3.select("#size-select");
  selectedElement
    .selectAll("options")
    .data(sorted)
    .enter()
    .append("option")
    .attr("value", (d) => d.key)
    .text((d) => d.key);

  const defaultSzie = d3.min(filtered, (d) => {
    return d.Size;
  });

  ///----line------

  const line = d3
    .line()
    .x(function (d) {
      console.log(d);
      return xScale(d.Date_new);
    })
    .y(function (d) {
      return yScale(d.Price);
    });

  //draw line
  const drawLine = (selection, size) => {
    let selectedSize = sorted.filter((e) => {
      return +e.key == size;
    });
    //data() is a data join function by itself and has sub-join functions enter() & exit()
    const linesDataJoin = selection.selectAll("path").data(selectedSize);
    linesDataJoin
      .enter()
      .append("path")
      //initial drawing, will not do once, won't update
      .attr("stroke", "#222222")
      .attr("stroke-width", 3)
      .attr("fill", "none")
      .merge(linesDataJoin)
      //code related to any changes goes from here
      .transition()
      .duration(1000)
      .attr("class", `line ${size}`)
      .attr("d", (d) => {
        return line(d.values);
      });

    //if need to remove lines
    //lines.exit().remove();
  };
  const lines = svg.append("g").attr("class", "lines");

  drawLine(lines, defaultSzie);

  document.getElementById("size-select").addEventListener("change", (event) => {
    drawLine(lines, event.target.value);
  });
  //-----tooltip-------

  const tooltip = body
    .append("div")
    .attr("id", "tooltip")
    .attr("z-index", "10")
    .style("opacity", 0)
    .style("position", "absolute");

  const tooltipDate = tooltip.append("div").attr("class", "tooltip date");

  const tooltipPrice = tooltip.append("div").attr("class", "tooltip-price");

  lines.select("path").on("mouseover", onMouseOver).on("mouseout", onMouseOut);

  //https://stackoverflow.com/questions/26882631/d3-what-is-a-bisector
  //in order for biset to work correctly, it needs to take an ascending array
  const bisectDate = d3.bisector((e) => e).left;

  function onMouseOver(d) {
    const x0 = xScale.invert(d3.mouse(this)[0]);
    const i = bisectDate(d.daterange, x0);
    const d0 = d.values[i - 1];
    const d1 = d.values[i];
    const dateMouseOver =
      Math.abs(x0 - d0.Date_new) > Math.abs(d1.Date_new - x0) ? d1 : d0;
    tooltip
      .style("opacity", 1)
      .style("left", d3.event.pageX - 20 + "px")
      .style("top", d3.event.pageY - 100 + "px");

    tooltipDate.html(`<p><b>Date:</b> ${dateMouseOver.Date}</p>`);
    tooltipPrice.html(`<p><b>Price:</b> $${dateMouseOver.Price}</p>`);
  }
  function onMouseOut() {
    tooltip.transition().duration(500).style("opacity", 0);
  }
});
