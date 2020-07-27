package servlets;

import java.io.InputStream;
import java.io.IOException;
import java.util.Properties;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.maps.model.LatLng;
import com.google.maps.model.PriceLevel;
import com.google.maps.model.PlaceType;
import com.google.maps.model.PlacesSearchResponse;
import com.google.maps.NearbySearchRequest;
import com.google.maps.GeoApiContext;

// Maps javadoc: https://www.javadoc.io/static/com.google.maps/google-maps-services/0.14.0/overview-summary.html

@WebServlet("/places-list")
public class PlacesListServlet extends HttpServlet {
    GeoApiContext context;
    Properties properties = new Properties();

    @Override
    public void init() {
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        InputStream input = classLoader.getResourceAsStream("server.properties");

        try {
            properties.load(input);
        }
        catch (IOException e) {
            System.out.printf("Error while trying to read config file: %s\n", e.toString());
        }

        this.context = new GeoApiContext.Builder()
            .apiKey(properties.getProperty("serverapikey"))
            .build();
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException{
        Double lat = Double.parseDouble(request.getParameter("lat"));
        Double lng = Double.parseDouble(request.getParameter("lng"));
        LatLng currentLocation = new LatLng(lat, lng);
        PriceLevel maxPrice = getPriceLevel(request.getParameter("price"));
        String filter = request.getParameter("filter");
        Integer distance = Integer.parseInt(request.getParemeter("dist"))

        NearbySearchRequest nearbySearch = new NearbySearchRequest(this.context)
            .location(currentLocation)
            .radius(500) // Metres, can change via filter
            .openNow(true)
            .maxPrice(maxPrice)
            .type(PlaceType.RESTAURANT);
        
        if (!filter.isEmpty()) nearbySearch.keyword(filter);

        try {
            PlacesSearchResponse nearby = nearbySearch.await(); //Returns top 20 results(One page)

            response.setContentType("application/json;");
            response.setCharacterEncoding("UTF-8");
            Gson gson = new Gson();
            response.getWriter().println(gson.toJson(nearby));
        }
        catch (IOException e) {
            throw e;
        }
        catch (Exception e) {
            throw new ServletException(e);
        }
    }

    private PriceLevel getPriceLevel(String price) {
      switch(price) {
        case "1":
          return PriceLevel.INEXPENSIVE;
        case "2":
          return PriceLevel.MODERATE;
        case "3":
          return PriceLevel.EXPENSIVE;
        case "4":
          return PriceLevel.VERY_EXPENSIVE;
        default:
          return PriceLevel.MODERATE;
      }
    }
}