let topogramAgua = function (options) {
    let self = {};
    for (let key in options) {
        self[key] = options[key];
    }
    self.parent_select = "#" + self.parent_id;
    self.url_topo = 'data/cuencas_uruguay_UH.topojson';
    self.url_deps = 'data/deptos_uy.topojson';
    self.url_base = 'data/disponibilidad01Q.topojson';
    //self.url_licencias = 'data/Permisos_agua-2011-2018.csv';
    self.url_licencias = 'data/Permisos-de-agua-2011-2018-OP-parcial.csv';

    self.center = [-56,-33.5];
    self.scale = 6000;

    self.body = d3.select("body");
    self.stat = d3.select("#status");

    self.filter_dh = {
        'Alta': true,
        'Media': true,
        'Baja': true
    };

    self.custom_color = {
        '8': "#A5D969",
        "7": "#C0DE67",
        '6': "#DEE364",
        "5": "#E9D261",
        '4': "#EEB85E",
        "3": "#F49A5A",
        '2': "#F97857",
        "1": "#FF5252",
    };
    self.niveles = {
        '8': "Muy Alto",
        "7": "Alto",
        '6': "Medio-Alto",
        "5": "Medio",
        '4': "Medio-Bajo",
        "3": "Bajo-Medio",
        '2': "Bajo",
        "1": "Muy bajo",
    };
    self.data = {
        'cuencas': {},
        'empresas': {},
        'departamentos': {},
        'licencias': [],
    };
    self.current_search = {
      'all_filters': {},
      'filters': {
        'tipos': {},
        'usos': {},
        'deptos': {},
        'destinos': {},
        'niveles': {},
        'empresas': {},
      },
      'selected':{
        'deptos': 'todos',
        'empresas': 'todos',
        'tipos': 'todos',
        'usos': 'todos',
        'destinos': 'todos',
        'niveles': 'todos',
      },
      'last_selected': '',
    };

    self.new_colors = {
        "1": "#ff5353",
        "2": "#fdae61",
        "3": "#ffeda0",
        "4": "#a6d96a",
        "undefined": "#4077ba"
    };

    self.map_priorizacion = {
        1: 'Muy Bajo',
        2: 'Bajo',
        3: 'Medio',
        4: 'Muy alto',
    }

    self.transform = d3.zoomIdentity;

    self.init = function () {
        if ($(window).width() < 768) {
            self.width = $(window).width();
            self.scale = 3000;
        }
        if ($(window).width() < 480) {
            self.scale = 2000;
        }
        self.projection = d3.geoMercator()
            .scale(self.scale)
            .center(self.center)
            .translate([self.width / 2, self.height / 2]);

        self.path = d3.geoPath().projection(self.projection);

        self.cartogram = d3.cartogram()
            .projection(self.projection)
            .properties(function (d) {
                return d.properties;
            })
            .value(function (d) {
                return 1;
            });

        self.svg = d3.select(self.parent_select);
        self.g = self.svg.append("g").attr('opacity', 1);
        self.g1 = self.g.append("g").attr('opacity', 1);
        // self.g1 = self.g.append("g").attr('opacity', 0);
        self.g2 = self.g.append("g");
        self.layer = self.g1.append("g")
            .attr("id", "layer");
        self.states = self.layer.append("g")
            .attr("id", "states")
            .selectAll("path");

        self.loadData();

        self.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", function () {
                self.transform = d3.event.transform;
                self.g.attr("transform", self.transform);
            });

        // Zoom in
        d3.select("#btn-zoom-in").on('click', function () {
            self.zoom_value = d3.zoomTransform(self.svg.node()).k + 0.5;
            self.svg.transition().duration(100)
                .call(self.zoom.scaleTo, self.zoom_value);
        });
        // Zoom out
        d3.select("#btn-zoom-out").on('click', function () {
            self.zoom_value = d3.zoomTransform(self.svg.node()).k - 0.5;
            self.svg.transition().duration(100)
                .call(self.zoom.scaleTo, self.zoom_value);
        });

        if ($(window).width() < 800) {
            self.svg
                .on("wheel", null)
                .on("wheel.zoom", null)
                .on("dblclick.zoom", null)
                .on("mousedown", null)
                .on("mousewheel", null)
                .on("mousemove", null)
                .on("mousedown.zoom", null)
                .on("mousewheel.zoom", null)
                .on("mousemove.zoom", null)
                .on("DOMMouseScroll.zoom", null)
                .on("dblclick.zoom", null)
                .on("touchstart", null)
                .on("touchmove", null)
                .on("touchend", null)
                .on("touchstart.zoom", null)
                .on("touchmove.zoom", null)
                .on("touchend.zoom", null);
        } else {
            self.svg.call(self.zoom);
        }
        $('#download').click(function(){
          // Use first element to choose the keys and the order
          var keys = Object.keys(self.current_search.licencias[0]);

          // Build header
          var result = keys.join(",") + "\n";

          // Add the rows
          self.current_search.licencias.forEach(function(obj){
              keys.forEach(function(k, ix){
                  if (ix) result += ",";
                  result += '"'+obj[k]+'"';
              });
              result += "\n";
          });
          var data, filename, link;
          filename = 'permisos-agua.csv';
          result = 'data:text/csv;charset=utf-8,' + result;
          data = encodeURI(result);

          link = document.createElement('a');
          link.setAttribute('href', data);
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    };

    self.loadData = function () {
        d3.json(self.url_topo, function (topo) {
            self.prerenderCuencas(topo);

            d3.json(self.url_base, function (error, zones) {
                if (error) throw error;
                self.renderBase(zones);
            //d3.json(self.url_deps, function (error, departamentos) {
              //  if (error) throw error;
                //self.renderDepartamentos(departamentos);

                d3.csv(self.url_licencias, function (licencias) {
                    self.prepareLicencias(licencias);
                    self.renderCuencas('area');
                    self.updateForm();
                    self.updateResults(1);

                    self.states
                        .attr("id", function (d, i) {
                            d.id = i;
                            return 'path-' + d.id;
                        })
                        .attr("a", function (d) {
                            if (self.data.cuencas[parseInt(d.properties.CODIGO)] !== undefined) {
                                self.data.cuencas[parseInt(d.properties.CODIGO)].d = d;
                            }
                        });

                    $("#btn-go").click(function () {
                        $(".landing").css('opacity', 0);
                        $(".viz-container").addClass('on');
                        setTimeout(function () {
                            $(".landing").css('display', 'none');
                        }, 250);

                        /* setTimeout(function () {
                            self.g1.transition().duration(500).ease(d3.easeLinear).attr('opacity', 1);
                            self.g2.transition().duration(1250).ease(d3.easeLinear).attr('opacity', 0);

                            setTimeout(function () {
                                self.states.transition()
                                    .duration(750)
                                    .ease(d3.easeLinear)
                                    .attr("fill", function (d) {
                                        if (self.priorizacion[parseInt(d.properties.CODIGO)] !== undefined) {
                                            return self.new_colors[self.priorizacion[parseInt(d.properties.CODIGO)]];
                                        }
                                        return self.custom_color['default'];
                                    });

                                $(".dh-check").addClass("selected");
                            }, 1500);
                        }, 1500); */
                    });
                });
            });
        });
    };

    self.renderDepartamentos = function (departamentos) {
        self.geodata_deps = topojson.feature(departamentos, departamentos.objects.deptos);

        self.g2
            .selectAll("path")
            .data(self.geodata_deps.features)
            .enter()
            .append("path")
            //.attr("fill", self.custom_color['default'])
            .style("opacity", 0.5)
            .style("pointer-events", "none")
            .attr("d", self.path);
    };
    self.renderBase = function (zones) {
        self.geodata_base = topojson.feature(zones, zones.objects.disponibilidad01);

        self.g2
            .selectAll("path")
            .data(self.geodata_base.features)
            .enter()
            .append("path")
            .attr("fill", function (d) { return self.custom_color[d.properties.classes];})
            .style("opacity", 1)
            .style("pointer-events", "none")
            .attr("d", self.path);
    };

    self.prerenderCuencas = function (topo) {
        self.topology = topo;
        self.geometries = self.topology.objects.UH.geometries;

        self.states = self.states
            .data(self.cartogram.features(self.topology, self.geometries))
            .enter()
            .append("path")
            .attr("fill", "transparent")
            .style("opacity", 0.5)
            .attr("d", self.path)
            .on('mousemove', function (d) {
                self.showTooltip(d);
            })
            .on('mouseout', function () {
                self.hideTooltip();
            })
            /*.on('click', function (d, i) {
                self.showInfo(self.cuencas_feautres[i]);
            })*/;


        var f = false;

        $("#check").click(function () {
            if (f) return;
            f = true;
            $(this).toggleClass('on');
            let key = $(this).hasClass('on') ? 'resoluciones' : 'area';
            self.renderCuencas(key, f);
            f = false;
        });
    };


    self.prepareLicencias = function (licencias) {
        self.licencias = licencias;
        licencias.forEach(licencia => {
            const id = licencia['CÓDIGO DE CUENCA'],
                razon_social = licencia['RAZÓN SOCIAL'],
                departamento = licencia.DEPARTAMENTO;

            if (self.data.cuencas[parseInt(id)] === undefined) {
                self.data.cuencas[parseInt(id)] = {
                    'id': id,
                    'nombre': licencia.CUENCA,
                    'tipo_uso': {
                        'Industrial': 0,
                        'Consumo Humano': 0,
                    		'Otros usos Agropecuarios': 0,
                    		'Riego': 0,
                    		'Usos No Consuntivos': 0,
                        'Minero': 0,
                        'Doméstico': 0,
                        'Poblacional': 0,
                        'Energético': 0,
                        'Agrícola': 0,
                        'Otros usos': 0,
                        'No definido': 0,
                    },
                    'clase': {
                        'Superficial': 0,
                        'Subterráneo': 0,
                    },
                    'resolucion': {
                        'Autorización': 0,
                        'Licencia': 0,
                        'Permiso': 0,
                        'CONCESION': 0,
                  			'EXTINCION DE PERMISO DE AGUAS': 0,
                  			'EXTINCION DE CONCESION DE AGUAS': 0,
                  			'EXTINCION DE PERMISO ESPECIAL': 0,
                  			'PERMISO': 0,
                  			'PERMISO ESPECIAL': 0,
                  			'REVOCACION DE PERMISO DE AGUAS': 0,
                  			'RESERVA DE AGUAS': 0,
                  			'SIN RESOLUCIÓN': 0,
                    },
                    'dh': licencia['DISPONIBILIDAD HÍDRICA'],
                    'ala': licencia['AUTORIDAD LOCAL DEL AGUA (ALA)'],
                    'aaa': licencia['AUTORIDAD ADMINISTRATIVA DEL AGUA (AAA)'],
                    'departamentos': [],
                    'empresas': [],
                    'provincia': licencia.PROVINCIA,
                    'distrito': licencia.DISTRITO,
                    'nro_licencias': 0,
                    'usos': {},
                };
            }

            self.data.cuencas[parseInt(id)].nro_licencias += 1;
            //La disponibilidad hídrica no está asociada a la cuenca
            //self.data.cuencas[parseInt(id)].DH = licencia['classes'];
            if ($.inArray(departamento, self.data.cuencas[parseInt(id)].departamentos) == -1) {
                self.data.cuencas[parseInt(id)].departamentos.push(departamento);
            }
            if ($.inArray(razon_social, self.data.cuencas[parseInt(id)].empresas) == -1) {
                self.data.cuencas[parseInt(id)].empresas.push(razon_social);
            }
            var tipo_obra = licencia['Tipo Obra'];
            var clase = 'Superficial';
            if ( licencia['Tipo Obra'] == 'POZO'){
              clase = 'Subterráneo';
            }
            self.data.cuencas[parseInt(id)].clase[clase] += 1;
            var resolucion = licencia['TIPO DE PERMISO'];
            self.data.cuencas[parseInt(id)].resolucion[resolucion] += 1;

            if (self.data.empresas[razon_social] === undefined) {
                self.data.empresas[razon_social] = {
                    'name': razon_social,
                    'ruc': licencia['N DE RUC'],
                    'afectados': '',
                    'conflictos': [],
                    cuencas: [],
                    'permisos': []
                };
            }
            //Agregamos los permisos para mostrarlos en el detalle de cada cuenca
            if (self.data.empresas[razon_social].permisos[parseInt(id)] === undefined) {
              self.data.empresas[razon_social].permisos[parseInt(id)] = [];
            }
            self.data.empresas[razon_social].permisos[parseInt(id)].push(licencia);

            if (self.data.departamentos[departamento] === undefined) {
                self.data.departamentos[departamento] = {
                    'name': departamento,
                    empresas: []
                };
            }
            if ($.inArray(razon_social, self.data.departamentos[departamento].empresas) == -1) {
                self.data.departamentos[departamento].empresas.push(razon_social);
            }
            var tipo_uso_lic = licencia['uso'];
            self.data.cuencas[parseInt(id)].tipo_uso[tipo_uso_lic] += 1
            self.updateSearch([licencia]);
        });
        self.current_search.all_filters = jQuery.extend(true, {}, self.current_search.filters);
        /*d3.csv('data/afectados.csv', function (afectados) {
            $.each(afectados, function (key, d) {
                var razon_social = d['RAZÓN SOCIAL'];
                if (self.data.empresas[razon_social] !== undefined) {
                    self.data.empresas[razon_social].afectados = d['MUERTOS Y HERIDOS EN CONFLICTO'];
                }
            });
        });
        d3.csv('data/conflictos.csv', function (conflictos) {
            $.each(conflictos, function (key, d) {
                var razon_social = d['RAZÓN SOCIAL'];
                if (self.data.empresas[razon_social] !== undefined) {
                    self.data.empresas[razon_social].conflictos.push(d['CONFLICTOS SOCIALES VIGENTES']);
                }
            });
        });*/

        self.priorizacion = {};

        d3.csv('data/priorizacion.csv', function (priorizacion) {
            $.each(priorizacion, function (key, d) {
                var cod = parseInt(d.codigo);
                self.priorizacion[cod] = d.priorizacion;
            });
        });
    }

    self.updateForm = function () {
      $("#close-info").click(function () {
        $(".modal").hide();
        $("body").removeClass('modal-active');
      });

      $("#tab1").click(function () {
        $("#block1").show();
        $("#block2").hide();
        $(".tabs li").removeClass('selected');
        $(this).addClass('selected');
      });
      $("#tab2").click(function () {
        $("#block2").show();
        $("#block1").hide();
        $(".tabs li").removeClass('selected');
        $(this).addClass('selected');
      });
    };

    self.updateSearch = function( licencias, reset = 0 ) {
      if ( !Array.isArray(licencias) ) {
        licencias = [licencias];
      }
      if (reset) {
        self.current_search.filters.usos = {};
        self.current_search.filters.tipos = {};
        self.current_search.filters.destinos = {};
        self.current_search.filters.deptos = {};
        self.current_search.filters.niveles = {};
        self.current_search.filters.empresas = {};
      }
      licencias.forEach(function(licencia){
        var filter_fields = {
          "usos": licencia['uso'],
          "destinos": licencia['destino'],
          'deptos': licencia.DEPARTAMENTO,
          'tipos': licencia['Tipo Obra'],
          'niveles': licencia['classes'],
          'empresas': licencia['RAZÓN SOCIAL'],
        }
        $.each(filter_fields, function(field, value){
          if ( value in self.current_search.filters[field] ) {
            self.current_search.filters[field][value].count++;
          }
          else {
            self.current_search.filters[field][value] = {
              'count': 1,
            };
          }
        });
      });
    }

    self.updateResults = function (init = 0) {
      if (init) {
        self.current_search.licencias = jQuery.extend(true, {}, self.licencias);
      }
      else {
        //Resetear licencias en caso que vuelva para atrás...
        if ( self.current_search.selected[self.current_search.last_selected] == 'todos' || self.current_search.last_selected == 'niveles' ) {
          self.current_search.licencias = self.licencias;
          //// TODO: No queremos mostrar todos los pines??

          //Destino anidado con uso
          if ( self.current_search.last_selected == 'usos' ){
            self.current_search.selected.destinos = 'todos';
          }
        }
        $("#results").html('');
        var current_licencias = self.current_search.licencias;
        self.current_search.licencias = [];
        var marks = [];
        //Borrar campos de filtros
        self.updateSearch([], 1);
        $.each(current_licencias, function ( key, licencia) {
          var campos = {
             'usos': licencia['uso'],
            'destinos': licencia['destino'],
            'deptos': licencia.DEPARTAMENTO,
            'tipos': licencia['Tipo Obra'],
            'niveles': licencia['classes'],
            'empresas': licencia['RAZÓN SOCIAL'],
          }
          var valid_licencia = 1;
          $.each(self.current_search.selected, function(selector, selected) {
            if ( selected != 'todos' && selected != campos[selector] ){
              valid_licencia = 0;
            }
          });
          if (valid_licencia){
            marks.push([licencia['x'], licencia['y']]);
            self.current_search.licencias.push(licencia);
            self.updateSearch([licencia]);
          }
        });
        self.g2.selectAll(".mark").remove();
        self.g2.selectAll(".mark")
          .data(marks).enter()
          .append("circle")
          .attr('class','mark')
          .attr('r', 4)
          .style("fill", "darkblue")
          .style("opacity", "0.75")
          //.attr("xlink:href",'https://cdn3.iconfinder.com/data/icons/softwaredemo/PNG/24x24/DrawingPin1_Blue.png')
          .attr("transform", d => `translate(${self.projection(d)})`
          )
          .on('click', function (d, i) {
              var licencia = self.current_search.licencias[i];
              let tooltip = d3.select("#map-tooltip");
              let cords, left, top;
              cords = self.transform.apply(self.projection(d));
              left = cords[0];
              top = cords[1];
              tooltip.select('.nombre').text(licencia['RAZÓN SOCIAL']);
              var ta = '<span>' + licencia['TIPO DE PERMISO'] + '</span>' + licencia['Tipo Obra'] + '<br>';
              ta += '<span>' + licencia.uso + '</span>' + licencia.destino + '<br>';
              tooltip.select('.nro').html(ta);
              tooltip
                .style('left', left + 'px')
                .style('top', (top - 14) + 'px')
                .style('display', 'block');
          });
        /*$("#results div").click(function () {
            $("#cuenca-info").show();
            let key = $(this).data('key');
            self.showInfo(self.data.cuencas[key].d);
        });*/

        $("#results div").mouseover(function () {
            let key = $(this).data('key');
            self.showTooltip(self.data.cuencas[key].d, true);
        }).mouseout(function () {
            self.hideTooltip();
        });
      }
      if ( self.current_search.licencias.length == 0 ){
        console.log('Te quedaste sin licencias!');
        /*$('#btn-hw').append('<span>Te quedaste sin lincencias!<br>Comienza de nuevo</span>');
        $('#btn-hw').delay(5000).text('Ver licencias');
        self.current_search.all_filters = self.current_search.all_filters;
        self.current_search.licencias = self.licencias;
        $(".modal").show();
        $("html,body").scrollTop(0);
        $("body").addClass('modal-active');*/
      }
      else {
        self.updateFilters(self.current_search.filters);
      }
    };

    //Create Filter Options
    self.updateFilters = function(filter_obj) {
      console.log(filter_obj);
      // Sacamos los triggers para que no se ejecuten
      $('.prioridad').click(false);
      $(".chosen-select").change(false);
      $.each(filter_obj, function (filter_key, filter_group) {
        $('#'+filter_key+' option').remove();
        //Si hay un solo objeto lo dejo seleccionado
        $("#"+filter_key).append($("<option value='todos'></option>").text('todos'));
        var last = '';
        if ( Object.keys(filter_group).length === 1 ) {
          var group_name = Object.keys(filter_group)[0];
          $("#"+filter_key).append($("<option value='"+group_name+"'></option>").text('('+filter_group[group_name].count+') '+group_name));
          $("#"+filter_key).val(group_name);
        }
        else {
          /*$.each(filter_group, function (group_name, obj) {
            $("#"+filter_key).append($("<option value='"+group_name+"'"+last+"></option>").text('('+obj.count+') '+group_name));
          });*/
          var groupFilters =[];
          $.each(filter_group, function (group_name, obj) {
            groupFilters.push([group_name, obj.count]);
          });
          //console.log(groupFilters.sort().reverse());
          groupFilters.sort(function(a, b){return b[1] - a[1];}).forEach(function (opt) {
            $("#"+filter_key).append($("<option value='"+opt[0]+"'></option>").text('('+opt[1]+') '+opt[0]));
          });
        }
        //Filtro especial por nivel
        if ( filter_key == 'niveles' ){
          //// TODO: Seteo en 0 a priori
          var totals = 0;
          for (let i = 1; i < 9; i++) {
            $('#niveles option[value="'+i+'"]').text(self.niveles[i]);
            if ( i in filter_group ){
              console.log(filter_group[i].count);
              totals += filter_group[i].count;
              $('#prioridad-'+i).fadeTo("slow", 1);
              $('#prioridad-'+i+' span').text(filter_group[i].count);
              $('#prioridad-'+i).click(function(){
                $('.prioridad:not(#prioridad-'+i+')').fadeTo("slow", 0.4);
                $('#prioridad-'+i).fadeTo("slow", 1);
                self.current_search.selected[filter_key] = i;
                self.current_search.last_selected = filter_key;
                self.updateResults();
              });
            }
            else {
              $('#prioridad-'+i).fadeTo("slow", 0.4);
              $('#prioridad-'+i+' span').text('-');
            }
          }
          /*if ( Object.keys(filter_group).length === 1 ) {
            $('#prioridad-0 span').text('(-) ');
          }
          else {
          }*/
          $('#prioridad-0 span').text(totals);
        }
      });
    }

    self.showInfo = function (d) {
        let info = d3.select("#cuenca-info");

        if (self.data.cuencas[parseInt(d.properties.CODIGO)] !== undefined) {
            $(".modal").show();
            $("html,body").scrollTop(0);
            $("body").addClass('modal-active');
            $("#block-alter1").show();
            $("#block-alter2").hide();

            info.select(".nombre").text(d.properties.NOMBRE);

            var tu = '';
            var total = 0;
            $.each(self.data.cuencas[parseInt(d.properties.CODIGO)].tipo_uso, function (key, ee) {
              //Considera que la planilla está normalizada :(
              console.log('TOTAL '+key+': '+ee);
              if ( !isNaN(ee) ) {
                if (ee > 0) {
                  tu += '<span>(' + ee + ')</span>' + key + '<br>';
                }
                total += ee;
              }
            });
            info.select(".tipo-uso").html(tu);

            var ta = '';
            var plur = {
                'Autorización': 'Autorizaciones',
                'Licencia': 'Licencias',
                'Permiso': 'Permisos',
                'CONCESION': 'CONCESIONES',
                'EXTINCION DE PERMISO DE AGUAS': 'EXTINCIONES DE PERMISO DE AGUAS',
                'EXTINCION DE CONCESION DE AGUAS': 'EXTINCIONES DE CONCESION DE AGUAS',
                'EXTINCION DE PERMISO ESPECIAL': 'EXTINCIONES DE PERMISO ESPECIAL',
                'PERMISO': 'PERMISOS',
                'PERMISO ESPECIAL': 'PERMISOS ESPECIALES',
                'REVOCACION DE PERMISO DE AGUAS': 'REVOCACIONES DE PERMISO DE AGUAS',
                'RESERVA DE AGUAS': 'RESERVAS DE AGUAS',
                'SIN RESOLUCIÓN': 'SIN RESOLUCIONES',
            };
            $.each(self.data.cuencas[parseInt(d.properties.CODIGO)].resolucion, function (key, ee) {
                if (ee > 1) {
                    ta += '<span>(' + ee + ')</span>' + plur[key] + '<br>';
                } else if (ee == 1) {
                    ta += '<span>(' + ee + ')</span>' + key + '<br>';
                }
            });
            info.select(".tipo-resolucion").html(ta);

            //
            var cf = self.data.cuencas[parseInt(d.properties.CODIGO)].clase;

            var chart = bb.generate({
                bindto: "#chart-fuente",
                "size": {
                    "height": 160,
                    "width": self.width < 400 ? 160 : 200,
                },
                data: {
                    type: "pie",
                    columns: [
                        ["Superficial", cf['Superficial']],
                        ["Subterráneo", cf['Subterráneo']]
                    ],
                    "colors": {
                        "Superficial": "#8da0cb",
                        "Subterráneo": "#ff4b4b"
                    }
                },
                "pie": {
                    "label": {
                        "format": function (value, ratio, id) {
                            // return d3.format('$')(value);
                            return value;
                        }
                    }
                },
                "tooltip": {
                    "format": {
                        "title": function (d) { return d; },
                        "value": function (value, ratio, id) {
                            return value;
                        }
                    }
                }
            });

            info.select(".total-resolucion").html('Total de resoluciones: ' + total);
            info.select(".disponibilidad-hidrica").text(self.map_priorizacion[self.priorizacion[parseInt(d.properties.CODIGO)]]);
            info.select(".ala").text(self.data.cuencas[parseInt(d.properties.CODIGO)].ala);
            info.select(".aaa").text(self.data.cuencas[parseInt(d.properties.CODIGO)].aaa);
            info.select(".departamento").text(self.data.cuencas[parseInt(d.properties.CODIGO)].departamentos.join(", "));

            // Empresas
            var total_empresas = self.data.cuencas[parseInt(d.properties.CODIGO)].empresas.length;
            var total_empresas_c = 0;
            var ff = true;
            $(".empresas-conflictos").html('');
            $.each(self.data.cuencas[parseInt(d.properties.CODIGO)].empresas, function (i, d) {
                var empresa = self.data.empresas[d];
                if (empresa.afectados !== '' || empresa.conflictos.length > 0) {
                    total_empresas_c += 1;

                    var el = $("<div></div>", { class: 'item' + (ff ? ' active' : '') });
                    var name = $("<div></div>", { class: 'razon-social' }).html('<img src="dist/images/wagon.png" /> ' + d);
                    var afectados = '';
                    var conflictos = $("<ul></ul>", { class: 'conflictos' });

                    if (empresa.afectados !== '') {
                        afectados = $("<div></div>", { class: 'afectados' }).text(empresa.afectados);
                    }

                    empresa.conflictos.forEach(function (zz) {
                        conflictos.append($("<li></li>", { class: 'conflicto' }).text(zz));
                    });

                    el.append(name).append(afectados).append(conflictos);

                    $(".empresas-conflictos").append(el);
                    ff = false;
                }
            });

            if (total_empresas_c == 0) {
                $.each(self.data.cuencas[parseInt(d.properties.CODIGO)].empresas, function (i, d) {
                    var el = $("<div></div>", { class: 'item' });
                    var name = $("<div></div>", { class: 'razon-social' }).html('<img src="dist/images/wagon.png" /> ' + d);

                    el.append(name);
                    $(".empresas-conflictos").append(el);
                });
            }

            $(".empresas-conflictos .item").click(function () {
                $(".empresas-conflictos .item").removeClass('active');
                $(this).addClass('active');
            });

            var empresas_texto = '';
            if (total_empresas > 0) {
                if (total_empresas == 1) {
                    empresas_texto = 'De <span>' + total_empresas + '</span> empresa que ocupa esta cuenca';
                } else {
                    empresas_texto = 'De las <span>' + total_empresas + '</span> empresas que ocupan esta cuenca';
                }
                if (total_empresas_c == 1) {
                    empresas_texto += ', <span>' + total_empresas_c + '</span> está vinculada a conflictos sociales.';
                } else {
                    empresas_texto += ', <span>' + total_empresas_c + '</span> están vinculadas a conflictos sociales.';
                }
            } else {
                if (total_empresas_c == 1) {
                    empresas_texto = '<span>' + total_empresas + '</span> empresa ocupa esta cuenca.';
                } else {
                    empresas_texto = '<span>' + total_empresas + '</span> empresas ocupan esta cuenca.';
                }
            }
            $("#block2 .total").html(empresas_texto);

            let cuenca_map = new cuencaMap({
                parent_id: 'cuenca-map',
                width: $("#cuenca-map").width(),
                height: $("#cuenca-map").height(),
            });
            cuenca_map.render(d, self.geodata_deps, self.projection, self.new_colors[self.priorizacion[parseInt(d.properties.CODIGO)]]);
        } else {
            console.log('Sin información :', d.properties);
            $(".modal").show();
            $("html,body").scrollTop(0);
            $("body").addClass('modal-active');
            info.select(".nombre").text(d.properties.NOMBRE);
            info.select('.disponibilidad-hidrica').text(self.map_priorizacion[self.priorizacion[parseInt(d.properties.CODIGO)]]);
            info.select('.ala').text('');
            info.select('.departamento').text('');

            $("#block-alter2").show();
            $("#block-alter1").hide();

            let cuenca_map = new cuencaMap({
                parent_id: 'cuenca-map',
                width: $("#cuenca-map").width(),
                height: $("#cuenca-map").height(),
            });
            cuenca_map.render(d, self.geodata_deps, self.projection, self.new_colors[self.priorizacion[parseInt(d.properties.CODIGO)]]);
        }
    };

    function getMyCentroid(d) {
        var element = d3.select("#path-" + d.id);
        var bbox = element.node().getBBox();
        return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
    }


    self.showTooltip = function (d, flag) {
        // if (self.data.cuencas[parseInt(d.properties.CODIGO)] == undefined) return;
        let tooltip = d3.select("#map-tooltip");
        let cords, left, top;
        if (!flag) {
            cords = d3.mouse(self.svg.node());
            left = cords[0];
            top = cords[1] - 10;
        } else {
            cords = getMyCentroid(d);
            cords = self.transform.apply(cords);
            left = cords[0];
            top = cords[1];
        }

        tooltip.select('.nombre').text(d.properties.NOMBRE);
        if (self.data.cuencas[parseInt(d.properties.CODIGO)] !== undefined) {
            var ta = '';
            var plur = {
                'Autorización': 'Autorizaciones',
                'Licencia': 'Licencias',
                'Permiso': 'Permisos',
                'CONCESION': 'CONCESIONES',
                'EXTINCION DE PERMISO DE AGUAS': 'EXTINCIONES DE PERMISO DE AGUAS',
                'EXTINCION DE CONCESION DE AGUAS': 'EXTINCIONES DE CONCESION DE AGUAS',
                'EXTINCION DE PERMISO ESPECIAL': 'EXTINCIONES DE PERMISO ESPECIAL',
                'PERMISO': 'PERMISOS',
                'PERMISO ESPECIAL': 'PERMISOS ESPECIALES',
                'REVOCACION DE PERMISO DE AGUAS': 'REVOCACIONES DE PERMISO DE AGUAS',
                'RESERVA DE AGUAS': 'RESERVAS DE AGUAS',
                'SIN RESOLUCIÓN': 'SIN RESOLUCIONES',
            };
            $.each(self.data.cuencas[parseInt(d.properties.CODIGO)].resolucion, function (key, ee) {
                if (ee > 1) {
                    ta += '<span>(' + ee + ')</span>' + plur[key] + '<br>';
                } else if (ee == 1) {
                    ta += '<span>(' + ee + ')</span>' + key + '<br>';
                }
            });
            tooltip.select('.nro').html(ta);
        } else {
            tooltip.select('.nro').html('');
        }
        tooltip
            .style('display', 'block')
            .style('left', left + 'px')
            .style('top', top + 'px');
    };

    self.hideTooltip = function () {
        let tooltip = d3.select("#map-tooltip");
        tooltip.style('display', 'none');
    };

    self.renderCuencas = function (key) {
        let start = Date.now();
        self.body.classed("updating", true);

        let value = function (d) {
            if (key == 'area') {
                // if (key == 'area' || (self.filter_dh['Alta'] == false && self.filter_dh['Media'] == false && self.filter_dh['Baja'] == false)) {
                return d.properties.area;
            } else {
                if (self.data.cuencas[parseInt(d.properties.CODIGO)] === undefined ||
                    self.filter_dh[self.data.cuencas[parseInt(d.properties.CODIGO)].DH] === false)
                    return 0;
                return self.data.cuencas[parseInt(d.properties.CODIGO)].nro_licencias;
            }
        },
            values = self.states.data()
                .map(value)
                .filter(function (n) {
                    return !isNaN(n);
                })
                .sort(d3.ascending),
            lo = values[0],
            hi = values[values.length - 1];

        // normalize the scale to positive numbers
        let scale = d3.scaleLinear()
            .domain([lo, hi])
            .range([1, 700]);

        // tell the cartogram to use the scaled values
        self.cartogram.value(function (d) {
            return scale(value(d));
        });

        // generate the new features, pre-projected
        let features = self.cartogram(self.topology, self.geometries).features;

        if (key == 'area') {
            self.cuencas_feautres = features;
        }

        self.states.data(features);

        self.states.transition()
            .duration(750)
            .ease(d3.easeLinear)
            .attr("d", self.cartogram.path);

        let delta = (Date.now() - start) / 1000;

        self.stat.text(["calculated in", delta.toFixed(1), "seconds"].join(" "));
        self.body.classed("updating", false);
    };

    self.init();
    return self;
};

let topogram_agua = new topogramAgua({
    parent_id: 'map',
    width: $("#map").width(),
    height: $("#map").height()
});
